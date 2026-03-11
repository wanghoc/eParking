"""
Plate Recognizer Inference Module
YOLO11n character-level detector để nhận diện ký tự trên biển số xe Việt Nam
Detect từng ký tự riêng lẻ rồi ghép lại theo thứ tự vị trí
"""

import cv2
import numpy as np
import os

from ultralytics import YOLO


class PlateRecognizer:
    """
    YOLO-based character recognizer cho biển số xe
    Detect từng ký tự → sắp xếp theo vị trí → ghép thành chuỗi
    Hỗ trợ biển số 1 dòng và 2 dòng
    """

    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))

        self.model_path = os.path.join(model_dir, 'plate_recognizer.pt')

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        print(f"[PlateRecognizer] Loading YOLO character model from {self.model_path}")
        self.model = YOLO(self.model_path)
        print(f"[PlateRecognizer] Model loaded - {len(self.model.names)} classes: {list(self.model.names.values())}")

    def recognize(self, image, conf=0.25):
        """
        Nhận diện ký tự trên ảnh biển số đã crop

        Args:
            image: numpy array (BGR or grayscale) - cropped license plate
            conf: confidence threshold

        Returns:
            str: Recognized plate text
        """
        try:
            # Đảm bảo ảnh là 3 channels cho YOLO
            if len(image.shape) == 2:
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            elif image.shape[2] == 1:
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

            results = self.model(image, conf=conf, verbose=False)

            if not results or len(results) == 0:
                return ""

            result = results[0]
            if result.boxes is None or len(result.boxes) == 0:
                return ""

            # Thu thập detections: (x_center, y_center, class_name, conf)
            detections = []
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0])
                char = self.model.names[cls_id]
                c = float(box.conf[0])
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                detections.append((cx, cy, char, c))

            if not detections:
                return ""

            # Sắp xếp ký tự theo vị trí (hỗ trợ biển 2 dòng)
            text = self._sort_and_assemble(detections, image.shape[0])
            return text

        except Exception as e:
            print(f"[PlateRecognizer] Recognition error: {e}")
            return ""

    def _sort_and_assemble(self, detections, img_height):
        """
        Sắp xếp detections theo vị trí và ghép thành chuỗi.
        Hỗ trợ biển số 1 dòng và 2 dòng (Việt Nam).

        Biển 2 dòng: dòng trên chứa mã tỉnh + seri, dòng dưới chứa số.
        Phân biệt bằng y_center so với chiều cao ảnh.
        """
        if len(detections) <= 1:
            return detections[0][2] if detections else ""

        # Tính median y để phân chia dòng
        ys = [d[1] for d in detections]
        y_min, y_max = min(ys), max(ys)
        y_range = y_max - y_min

        # Nếu y_range > 30% chiều cao → biển 2 dòng
        if y_range > img_height * 0.3 and len(detections) >= 4:
            y_mid = (y_min + y_max) / 2
            top_row = sorted([d for d in detections if d[1] < y_mid], key=lambda d: d[0])
            bot_row = sorted([d for d in detections if d[1] >= y_mid], key=lambda d: d[0])
            chars = [d[2] for d in top_row] + [d[2] for d in bot_row]
        else:
            # 1 dòng: sắp xếp trái → phải
            sorted_dets = sorted(detections, key=lambda d: d[0])
            chars = [d[2] for d in sorted_dets]

        return ''.join(chars)


# Global singleton
_recognizer = None


def get_recognizer():
    """Singleton accessor"""
    global _recognizer
    if _recognizer is None:
        _recognizer = PlateRecognizer()
    return _recognizer


def recognize_plate(image):
    """Helper function"""
    return get_recognizer().recognize(image)


if __name__ == '__main__':
    import sys

    print("\n" + "=" * 60)
    print("Testing Plate Recognizer (YOLO character detector)")
    print("=" * 60)

    recognizer = PlateRecognizer()

    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            print(f"\nTesting with image: {image_path}")
            img = cv2.imread(image_path)
            if img is not None:
                result = recognizer.recognize(img)
                print(f"Result: {result}")
            else:
                print("Failed to load image")
    else:
        print("\nRecognizer ready!")
        print("Usage: python plate_recognizer_inference.py <image_path>")

    print("=" * 60 + "\n")
