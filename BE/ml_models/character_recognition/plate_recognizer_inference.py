"""
Plate Recognizer Inference Module
Custom trained CNN-LSTM model để nhận diện ký tự trên biển số xe Việt Nam
Thay thế EasyOCR để có độ chính xác cao hơn và tốc độ nhanh hơn
"""

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import cv2
import numpy as np
from PIL import Image
import os
import json


class CNNLSTM(nn.Module):
    """
    CNN-LSTM Architecture cho license plate recognition
    CNN: Trích xuất features từ ảnh biển số
    LSTM: Nhận diện chuỗi ký tự
    """
    
    def __init__(self, num_chars, hidden_size=256, num_layers=2):
        super(CNNLSTM, self).__init__()
        
        # CNN Backbone - Trích xuất features
        self.cnn = nn.Sequential(
            # Conv Block 1
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 128x32 -> 64x16
            
            # Conv Block 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 64x16 -> 32x8
            
            # Conv Block 3
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),  # 32x8 -> 16x8
            
            # Conv Block 4
            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),  # 16x8 -> 8x8
        )
        
        # LSTM - Sequence modeling
        self.lstm = nn.LSTM(
            input_size=512 * 8,  # CNN output channels * height
            hidden_size=hidden_size,
            num_layers=num_layers,
            bidirectional=True,
            batch_first=True
        )
        
        # Output layer
        self.fc = nn.Linear(hidden_size * 2, num_chars)  # *2 vì bidirectional
    
    def forward(self, x):
        """
        Args:
            x: (batch, 1, height, width) - Grayscale image
        Returns:
            (batch, seq_len, num_chars) - Character probabilities
        """
        # CNN feature extraction
        conv_out = self.cnn(x)  # (batch, 512, 8, width/16)
        
        # Reshape cho LSTM: (batch, seq_len, features)
        batch, channels, height, width = conv_out.size()
        conv_out = conv_out.permute(0, 3, 1, 2)  # (batch, width, channels, height)
        conv_out = conv_out.reshape(batch, width, channels * height)  # (batch, seq_len, features)
        
        # LSTM
        lstm_out, _ = self.lstm(conv_out)  # (batch, seq_len, hidden_size*2)
        
        # Output projection
        output = self.fc(lstm_out)  # (batch, seq_len, num_chars)
        
        return output


class PlateRecognizer:
    """
    Wrapper class cho plate recognizer model
    Tối ưu cho tốc độ và độ chính xác cao
    """
    
    def __init__(self, model_dir=None):
        """
        Args:
            model_dir: Thư mục chứa model (plate_recognizer.pt) và config.json
        """
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.model_dir = model_dir
        self.config_path = os.path.join(model_dir, 'config.json')
        self.model_path = os.path.join(model_dir, 'plate_recognizer.pt')
        
        # Load config
        self._load_config()
        
        # Setup device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[PlateRecognizer] Using device: {self.device}")
        
        # Load model
        self._load_model()
        
        # Setup transforms
        self._setup_transforms()
        
        print(f"[PlateRecognizer] Model loaded successfully from {self.model_path}")
        print(f"[PlateRecognizer] Character set: {self.char_list}")
    
    def _load_config(self):
        """Load configuration từ config.json"""
        with open(self.config_path, 'r') as f:
            self.config = json.load(f)
        
        # Parse config
        self.input_size = tuple(self.config['input_size'])  # (width, height)
        self.characters = self.config['characters']
        self.max_length = self.config['max_length']
        
        # Create character mappings
        self.char_list = list(self.characters)
        self.char_to_idx = {char: idx for idx, char in enumerate(self.char_list)}
        self.idx_to_char = {idx: char for idx, char in enumerate(self.char_list)}
        self.num_chars = len(self.char_list) + 1  # +1 cho CTC blank
        
        # Preprocessing params
        self.mean = self.config['preprocessing']['mean']
        self.std = self.config['preprocessing']['std']
    
    def _load_model(self):
        """Load model từ checkpoint"""
        # Khởi tạo model architecture
        self.model = CNNLSTM(num_chars=self.num_chars, hidden_size=256, num_layers=2)
        
        # Load weights (weights_only=False for compatibility with older checkpoints)
        checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
        
        # Handle different checkpoint formats
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            elif 'state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
        else:
            self.model.load_state_dict(checkpoint)
        
        # Move to device và set eval mode
        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Optimize cho inference
        if self.device.type == 'cuda':
            self.model = self.model.half()  # FP16 cho tốc độ
    
    def _setup_transforms(self):
        """Setup image preprocessing transforms"""
        self.transform = transforms.Compose([
            transforms.Resize((self.input_size[1], self.input_size[0])),  # (height, width)
            transforms.Grayscale(num_output_channels=1),
            transforms.ToTensor(),
            transforms.Normalize(mean=self.mean, std=self.std)
        ])
    
    def preprocess_image(self, image):
        """
        Tiền xử lý ảnh biển số
        
        Args:
            image: numpy array (BGR từ OpenCV) hoặc PIL Image
        
        Returns:
            torch.Tensor: Preprocessed image tensor
        """
        # Convert numpy array sang PIL Image nếu cần
        if isinstance(image, np.ndarray):
            # OpenCV BGR -> RGB
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image)
        
        # Apply transforms
        tensor = self.transform(image)
        
        # Add batch dimension
        tensor = tensor.unsqueeze(0)  # (1, 1, H, W)
        
        return tensor
    
    def decode_predictions(self, predictions):
        """
        Decode CTC predictions sang text
        
        Args:
            predictions: torch.Tensor (batch, seq_len, num_chars)
        
        Returns:
            str: Decoded text
        """
        # Get best path (greedy decoding)
        _, preds = torch.max(predictions, dim=2)  # (batch, seq_len)
        preds = preds.squeeze(0).cpu().numpy()  # (seq_len,)
        
        # CTC decoding - remove blanks và duplicates
        decoded_chars = []
        prev_char = None
        
        for pred_idx in preds:
            # Skip CTC blank (index 0)
            if pred_idx == self.num_chars - 1:
                prev_char = None
                continue
            
            # Skip duplicates
            if pred_idx == prev_char:
                continue
            
            # Add character
            if pred_idx < len(self.char_list):
                char = self.idx_to_char.get(pred_idx, '')
                if char:
                    decoded_chars.append(char)
                    prev_char = pred_idx
        
        return ''.join(decoded_chars)
    
    def recognize(self, image):
        """
        Nhận diện ký tự trên biển số
        
        Args:
            image: numpy array (BGR from OpenCV) - cropped license plate
        
        Returns:
            str: Recognized plate number
        """
        try:
            # Preprocess
            tensor = self.preprocess_image(image)
            tensor = tensor.to(self.device)
            
            # FP16 nếu dùng CUDA
            if self.device.type == 'cuda':
                tensor = tensor.half()
            
            # Inference
            with torch.no_grad():
                predictions = self.model(tensor)  # (1, seq_len, num_chars)
            
            # Decode
            text = self.decode_predictions(predictions)
            
            return text
        
        except Exception as e:
            print(f"[PlateRecognizer] Recognition error: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    def batch_recognize(self, images):
        """
        Nhận diện nhiều biển số cùng lúc (batch processing)
        
        Args:
            images: List of numpy arrays
        
        Returns:
            List[str]: List of recognized texts
        """
        try:
            # Preprocess all images
            tensors = [self.preprocess_image(img) for img in images]
            batch_tensor = torch.cat(tensors, dim=0)  # (batch, 1, H, W)
            batch_tensor = batch_tensor.to(self.device)
            
            if self.device.type == 'cuda':
                batch_tensor = batch_tensor.half()
            
            # Batch inference
            with torch.no_grad():
                predictions = self.model(batch_tensor)  # (batch, seq_len, num_chars)
            
            # Decode each prediction
            results = []
            for i in range(predictions.size(0)):
                text = self.decode_predictions(predictions[i:i+1])
                results.append(text)
            
            return results
        
        except Exception as e:
            print(f"[PlateRecognizer] Batch recognition error: {e}")
            return [""] * len(images)


# Global recognizer instance (singleton pattern)
_recognizer = None

def get_recognizer():
    """
    Get hoặc khởi tạo PlateRecognizer instance
    Singleton pattern để load model 1 lần duy nhất
    """
    global _recognizer
    if _recognizer is None:
        _recognizer = PlateRecognizer()
    return _recognizer


def recognize_plate(image):
    """
    Helper function để nhận diện biển số
    
    Args:
        image: numpy array (BGR) - cropped license plate
    
    Returns:
        str: Recognized plate number
    """
    recognizer = get_recognizer()
    return recognizer.recognize(image)


# Test function
if __name__ == '__main__':
    import sys
    
    print("\n" + "=" * 60)
    print("Testing Plate Recognizer")
    print("=" * 60)
    
    # Initialize recognizer
    recognizer = PlateRecognizer()
    
    # Test với ảnh nếu có
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
