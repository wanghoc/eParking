class CloudUnavailable(Exception):
    """Không kết nối được Cloud (mất mạng, timeout, 5xx). Edge chuyển sang xử lý offline."""


class DeviceUnauthorized(Exception):
    """API key của máy trạm sai hoặc đã bị thu hồi (HTTP 401). Cần cấp lại key, không retry."""
