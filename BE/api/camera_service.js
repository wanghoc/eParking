const { spawn } = require('child_process');
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../lib/auth');

const router = express.Router();
const MAX_STREAMS = 8;
let activeStreams = 0;

router.use(requireAdmin);

// Ẩn user:pass trong URL khi trả về cho trình duyệt.
function maskUrl(url) {
  return url.replace(/^(rtsps?:\/\/)[^@/]*@/i, '$1***@');
}

const view = (c) => ({ id: c.id, name: c.name, location: c.location, rtsp_url: maskUrl(c.rtsp_url), created_at: c.created_at });

router.get('/', async (_req, res) => {
  try {
    const cameras = await prisma.camera.findMany({ orderBy: { id: 'asc' } });
    res.json(cameras.map(view));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy danh sách camera' });
  }
});

router.post('/', async (req, res) => {
  const { name, location, rtsp_url } = req.body || {};
  if (!name || !String(name).trim() || !rtsp_url) {
    return res.status(400).json({ message: 'Vui lòng nhập tên camera và RTSP URL' });
  }
  if (!/^rtsps?:\/\/\S+$/i.test(String(rtsp_url).trim())) {
    return res.status(400).json({ message: 'RTSP URL phải bắt đầu bằng rtsp:// (vd: rtsp://user:pass@192.168.1.10:554/stream1)' });
  }
  try {
    const camera = await prisma.camera.create({
      data: {
        name: String(name).trim().slice(0, 100),
        location: location ? String(location).trim().slice(0, 200) : null,
        rtsp_url: String(rtsp_url).trim().slice(0, 500),
      },
    });
    res.status(201).json(view(camera));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi thêm camera' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    await prisma.camera.delete({ where: { id } });
    res.json({ message: 'Đã xóa camera' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy camera' });
    console.error(err);
    res.status(500).json({ message: 'Lỗi xóa camera' });
  }
});

// Trình duyệt không phát được RTSP: ffmpeg đọc RTSP rồi trả về MJPEG (multipart) để hiển thị bằng <img>.
router.get('/:id/stream', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

  let camera;
  try {
    camera = await prisma.camera.findUnique({ where: { id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi đọc camera' });
  }
  if (!camera) return res.status(404).json({ message: 'Không tìm thấy camera' });
  if (activeStreams >= MAX_STREAMS) return res.status(503).json({ message: 'Đang có quá nhiều luồng xem, thử lại sau' });

  activeStreams += 1;
  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-rtsp_transport', 'tcp',
    '-timeout', '10000000', // 10s (µs) socket timeout
    '-i', camera.rtsp_url,
    '-an',
    '-vf', 'fps=8,scale=960:-2',
    '-q:v', '6',
    '-f', 'mpjpeg',
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let started = false;
  let stderr = '';
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activeStreams -= 1;
    ffmpeg.kill('SIGKILL');
  };

  ffmpeg.stderr.on('data', (d) => { stderr = (stderr + d).slice(-500); });
  ffmpeg.on('error', (err) => {
    console.error('ffmpeg spawn error:', err.message);
    if (!started && !res.headersSent) res.status(500).json({ message: 'Máy chủ chưa cài ffmpeg' });
    release();
  });
  ffmpeg.on('close', () => {
    if (!started && !res.headersSent) {
      console.error(`Camera ${id} stream failed: ${stderr.trim()}`);
      res.status(502).json({ message: 'Không kết nối được camera (kiểm tra RTSP URL, tài khoản, mạng)' });
    } else {
      res.end();
    }
    release();
  });

  ffmpeg.stdout.on('data', (chunk) => {
    if (!started) {
      started = true;
      res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace;boundary=ffmpeg',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      });
    }
    res.write(chunk);
  });

  res.on('close', release);
});

module.exports = { router };
