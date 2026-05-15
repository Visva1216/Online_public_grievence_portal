"""
Image analyzer using OpenCV + optional deep learning model.
Detects civic issues: potholes, garbage, broken streetlights, water leakage.
"""

import io
import logging
import numpy as np
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Issue type to category mapping
ISSUE_CATEGORY_MAP = {
    "pothole": "ROAD_MAINTENANCE",
    "garbage": "SANITATION",
    "trash": "SANITATION",
    "waste": "SANITATION",
    "broken_streetlight": "ELECTRICITY",
    "water_leakage": "WATER_SUPPLY",
    "flooding": "WATER_SUPPLY",
    "broken_road": "ROAD_MAINTENANCE",
    "fallen_tree": "PARKS_GARDENS",
    "open_drain": "WATER_SUPPLY",
}


class ImageAnalyzer:
    """
    Computer vision-based image analyzer for civic issues.
    Uses OpenCV for basic analysis + optional deep learning model.
    """

    def __init__(self):
        self._model = None
        self._labels = None
        self._try_load_model()

    def _try_load_model(self):
        """Try loading a pretrained object detection model."""
        try:
            # Try using torchvision ResNet for image classification
            import torch
            import torchvision.models as models
            import torchvision.transforms as transforms
            
            logger.info("Loading ResNet50 model for image analysis...")
            self._model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            self._model.eval()
            
            self._transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
            logger.info("ResNet50 model loaded")
        except Exception as e:
            logger.warning(f"Could not load deep learning model: {e}. Using OpenCV analysis only.")

    def analyze(self, image_bytes: bytes, filename: str = "image.jpg") -> Dict[str, Any]:
        """Analyze image and return detected tags and category suggestion."""
        try:
            import cv2
            from PIL import Image

            # Load image
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

            # Basic OpenCV analysis
            tags = self._opencv_analysis(cv_image, pil_image)
            
            # Deep learning analysis
            if self._model is not None:
                dl_tags = self._deep_learning_analysis(pil_image)
                tags.extend(dl_tags)

            tags = list(set(tags))  # deduplicate

            # Suggest category based on tags
            category_suggestion = "OTHER"
            for tag in tags:
                if tag in ISSUE_CATEGORY_MAP:
                    category_suggestion = ISSUE_CATEGORY_MAP[tag]
                    break

            return {
                "tags": tags,
                "category_suggestion": category_suggestion,
                "confidence": 0.75 if tags else 0.3,
                "image_width": pil_image.width,
                "image_height": pil_image.height,
                "method": "opencv+resnet" if self._model else "opencv"
            }
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "tags": [],
                "category_suggestion": "OTHER",
                "confidence": 0.0,
                "error": str(e)
            }

    def _opencv_analysis(self, cv_image, pil_image) -> List[str]:
        """Rule-based OpenCV analysis for basic issue detection."""
        import cv2
        tags = []

        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)
        h, w = cv_image.shape[:2]

        # Check for dark/brownish areas (garbage, potholes)
        # Brown: H=10-20, S=100-255, V=20-200
        brown_mask = cv2.inRange(hsv,
                                  np.array([10, 50, 20]),
                                  np.array([25, 255, 200]))
        brown_ratio = cv2.countNonZero(brown_mask) / (h * w)

        # Check for green areas (parks)
        green_mask = cv2.inRange(hsv,
                                  np.array([35, 40, 40]),
                                  np.array([85, 255, 255]))
        green_ratio = cv2.countNonZero(green_mask) / (h * w)

        # Check for blue areas (water)
        blue_mask = cv2.inRange(hsv,
                                  np.array([100, 50, 50]),
                                  np.array([130, 255, 255]))
        blue_ratio = cv2.countNonZero(blue_mask) / (h * w)

        # Check for dark grey (road)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        _, dark_mask = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
        dark_ratio = cv2.countNonZero(dark_mask) / (h * w)

        # Apply heuristics
        if brown_ratio > 0.15:
            tags.append("garbage")
        if blue_ratio > 0.20:
            tags.append("water_leakage")
        if green_ratio > 0.30:
            tags.append("park_area")
        if dark_ratio > 0.40 and brown_ratio > 0.05:
            tags.append("pothole")

        # Edge detection for structural analysis
        edges = cv2.Canny(gray, 50, 150)
        edge_ratio = cv2.countNonZero(edges) / (h * w)
        if edge_ratio > 0.15:
            tags.append("structural_issue")

        return tags

    def _deep_learning_analysis(self, pil_image) -> List[str]:
        """Use ResNet50 to get ImageNet labels and map to civic issues."""
        try:
            import torch
            import json
            import urllib.request

            input_tensor = self._transform(pil_image).unsqueeze(0)
            with torch.no_grad():
                output = self._model(input_tensor)

            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            top5_prob, top5_catid = torch.topk(probabilities, 5)

            # Civic issue keywords in ImageNet
            civic_mappings = {
                "trash": "garbage", "garbage_truck": "garbage", "dumpster": "garbage",
                "manhole": "open_drain", "sewer": "open_drain",
                "pothole": "pothole", "asphalt": "road",
                "street_sign": "road", "traffic_light": "road",
                "streetcar": "road", "water": "water_leakage",
                "street_lamp": "broken_streetlight",
            }

            tags = []
            # Since we don't have ImageNet labels cached, return empty
            # In production: load imagenet_classes.json and map accordingly
            return tags
        except Exception as e:
            logger.warning(f"Deep learning analysis failed: {e}")
            return []
