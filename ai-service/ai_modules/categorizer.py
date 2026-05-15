"""
NLP-based complaint categorizer and priority detector.
Uses keyword matching + optional transformer model.
"""

import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Category patterns (rule-based fallback)
# ─────────────────────────────────────────────────────────────
CATEGORY_PATTERNS = {
    "SANITATION": [
        "garbage", "waste", "trash", "litter", "dirt", "filth", "cow dung", "gutter",
        "sweeping", "cleaning", "overflowing bin", "dumping", "sewage overflow",
        "कूड़ा", "गंदगी", "सफाई", "कचरा"
    ],
    "WATER_SUPPLY": [
        "water", "pipe", "leakage", "supply", "drain", "sewage", "flood",
        "no water", "water cut", "broken pipe", "dirty water", "waterlogging",
        "पानी", "नल", "पाइप", "जल"
    ],
    "ELECTRICITY": [
        "electricity", "power", "light", "streetlight", "lamp", "bulb", "wire", "current",
        "no electricity", "power cut", "electric pole", "transformer", "short circuit",
        "बिजली", "रोशनी", "बत्ती"
    ],
    "ROAD_MAINTENANCE": [
        "road", "pothole", "footpath", "pavement", "highway", "street",
        "speed breaker", "divider", "broken road", "uneven road", "traffic signal",
        "सड़क", "गड्ढा", "फुटपाथ"
    ],
    "PUBLIC_SAFETY": [
        "crime", "police", "theft", "robbery", "fight", "assault", "safety",
        "security", "harassment", "eve teasing", "molestation", "accident",
        "अपराध", "सुरक्षा", "चोरी"
    ],
    "PARKS_GARDENS": [
        "park", "garden", "tree", "plant", "grass", "playground", "recreation",
        "broken bench", "vandalism in park", "overgrown",
        "पार्क", "बगीचा", "पेड़"
    ],
    "NOISE_POLLUTION": [
        "noise", "loud", "sound", "music", "honking", "party", "speaker",
        "construction noise", "generator", "loudspeaker", "dj",
        "शोर", "ध्वनि"
    ],
    "ANIMAL_NUISANCE": [
        "dog", "stray", "animal", "cattle", "cow", "monkey", "bite",
        "stray dog", "mad dog", "rabies", "pigeon", "rat",
        "कुत्ता", "आवारा", "जानवर"
    ]
}

PRIORITY_KEYWORDS = {
    "CRITICAL": [
        "danger", "urgent", "emergency", "fire", "accident", "injury", "death",
        "blood", "immediate", "life threatening", "collapse", "gas leak",
        "explosion", "drowning", "critical", "खतरनाक", "आपात"
    ],
    "HIGH": [
        "serious", "major", "broken", "no water", "no power", "days", "flooding",
        "weeks", "disease", "contamination", "falling", "damaged badly",
        "गंभीर", "बड़ी समस्या"
    ],
    "LOW": [
        "minor", "small", "suggestion", "request", "query", "please",
        "when possible", "convenience", "छोटी", "अनुरोध"
    ]
}


class ComplaintCategorizer:
    """
    Multi-layer complaint categorizer:
    1. Keyword matching (fast, no GPU required)
    2. Optional: zero-shot classification using HuggingFace transformers
    """

    def __init__(self):
        self._transformer_model = None
        self._try_load_transformer()

    def _try_load_transformer(self):
        """Try to load the zero-shot classifier (optional)."""
        try:
            from transformers import pipeline
            logger.info("Loading zero-shot classification model (this may take a moment)...")
            self._transformer_model = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1  # CPU
            )
            logger.info("Zero-shot model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load transformer model: {e}. Using keyword-based categorization.")

    def categorize(self, text: str, language: str = "en") -> Dict[str, Any]:
        """Categorize complaint text into predefined categories."""
        text_lower = text.lower()

        # 1. Keyword matching
        scores = {}
        for category, keywords in CATEGORY_PATTERNS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score

        if scores:
            best_category = max(scores, key=scores.get)
            total = sum(scores.values())
            confidence = min(scores[best_category] / max(total, 1) + 0.3, 0.95)

            # Boost with transformer if available
            if self._transformer_model and len(text) > 20:
                try:
                    labels = list(CATEGORY_PATTERNS.keys()) + ["OTHER"]
                    result = self._transformer_model(text[:512], candidate_labels=labels)
                    top_label = result['labels'][0]
                    top_score = result['scores'][0]
                    # Use transformer if more confident
                    if top_score > confidence:
                        return {
                            "category": top_label,
                            "confidence": round(top_score, 4),
                            "method": "transformer"
                        }
                except Exception as e:
                    logger.warning(f"Transformer categorization failed: {e}")

            return {
                "category": best_category,
                "confidence": round(confidence, 4),
                "method": "keyword-matching",
                "scores": scores
            }

        return {"category": "OTHER", "confidence": 0.5, "method": "default"}

    def detect_priority(self, text: str) -> Dict[str, Any]:
        """Detect priority level from complaint text."""
        text_lower = text.lower()

        for priority, keywords in PRIORITY_KEYWORDS.items():
            matches = [kw for kw in keywords if kw in text_lower]
            if matches:
                confidence = min(0.6 + 0.1 * len(matches), 0.95)
                return {
                    "priority": priority,
                    "confidence": round(confidence, 4),
                    "matched_keywords": matches,
                    "method": "keyword-matching"
                }

        return {"priority": "MEDIUM", "confidence": 0.60, "method": "default"}
