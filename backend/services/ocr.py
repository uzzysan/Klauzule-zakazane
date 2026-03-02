"""OCR service using Tesseract with Polish language support."""
import io

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

from config import settings


class OCRResult:
    """OCR result with text and metadata."""

    def __init__(
        self,
        text: str,
        confidence: float,
        ocr_used: bool = True,
        language: str = "pol",
        preprocessing_applied: bool = False,
    ):
        self.text = text
        self.confidence = confidence
        self.ocr_used = ocr_used
        self.language = language
        self.preprocessing_applied = preprocessing_applied
        self.success = len(text.strip()) > 0


class OCRService:
    """Service for OCR operations with Tesseract."""

    def __init__(self) -> None:
        """Initialize OCR service."""
        # Set Tesseract command path
        if settings.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

        self.languages = settings.tesseract_languages

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy.

        - Convert to grayscale
        - Enhance contrast
        - Apply slight sharpening
        - Remove noise
        """
        # Convert to grayscale
        if image.mode != "L":
            image = image.convert("L")

        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)

        # Sharpen
        image = image.filter(ImageFilter.SHARPEN)

        # Remove noise with median filter
        image = image.filter(ImageFilter.MedianFilter(size=3))

        return image

    def extract_text_from_image(
        self,
        image_data: bytes,
        language: str = "pol",
        preprocess: bool = True,
    ) -> OCRResult:
        """
        Extract text from image using Tesseract OCR.

        Args:
            image_data: Raw image bytes
            language: Language code (pol, eng, pol+eng)
            preprocess: Whether to apply preprocessing

        Returns:
            OCRResult with extracted text and confidence score
        """
        try:
            # Load image
            image = Image.open(io.BytesIO(image_data))

            # Preprocess if requested
            if preprocess:
                image = self.preprocess_image(image)

            # Configure Tesseract
            config = "--oem 3 --psm 3"  # LSTM engine, automatic page segmentation

            # Extract text with confidence data
            data = pytesseract.image_to_data(
                image,
                lang=language,
                config=config,
                output_type=pytesseract.Output.DICT,
            )

            # Calculate average confidence (excluding -1 values)
            confidences = [int(conf) for conf in data["conf"] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Extract text
            text = pytesseract.image_to_string(image, lang=language, config=config)

            return OCRResult(
                text=text.strip(),
                confidence=avg_confidence / 100.0,  # Convert to 0-1 range
                ocr_used=True,
                language=language,
                preprocessing_applied=preprocess,
            )

        except Exception:
            return OCRResult(
                text="",
                confidence=0.0,
                ocr_used=True,
                language=language,
                preprocessing_applied=False,
            )

    def is_text_layer_present(self, pdf_path: str) -> bool:
        """
        Check if PDF has a text layer (native text vs scanned).

        This is a simple heuristic - if we can extract text directly,
        we assume it has a native text layer.
        """
        try:
            import pdfplumber

            with pdfplumber.open(pdf_path) as pdf:
                # Check first page
                if len(pdf.pages) > 0:
                    text = pdf.pages[0].extract_text()
                    # If we get substantial text, assume native text layer
                    return text is not None and len(text.strip()) > 50
            return False
        except Exception:
            return False

    def extract_from_pdf_pages(
        self,
        pdf_path: str,
        language: str = "pol",
    ) -> OCRResult:
        """
        Extract text from PDF by converting pages to images and running OCR.

        This is used when PDF doesn't have a native text layer.
        """
        try:
            from pdf2image import convert_from_path

            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=300)

            all_text = []
            all_confidences = []

            for i, image in enumerate(images):
                # Convert PIL Image to bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format="PNG")
                img_byte_arr.seek(0)

                # Run OCR on image
                result = self.extract_text_from_image(
                    img_byte_arr.read(),
                    language=language,
                    preprocess=True,
                )

                all_text.append(result.text)
                all_confidences.append(result.confidence)

            # Combine results
            combined_text = "\n\n".join(all_text)
            avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0

            return OCRResult(
                text=combined_text,
                confidence=avg_confidence,
                ocr_used=True,
                language=language,
                preprocessing_applied=True,
            )

        except Exception:
            return OCRResult(
                text="",
                confidence=0.0,
                ocr_used=True,
                language=language,
            )

    def validate_polish_text(self, text: str) -> tuple[bool, float]:
        """
        Validate that text contains Polish characters and looks correct.

        Returns:
            Tuple of (is_valid, quality_score)
        """
        if not text or len(text.strip()) < 10:
            return False, 0.0

        # Polish special characters
        polish_chars = "ąćęłńóśźż"
        polish_chars_upper = polish_chars.upper()

        # Count Polish characters
        polish_count = sum(1 for c in text if c in polish_chars or c in polish_chars_upper)

        # Calculate ratio
        total_alpha = sum(1 for c in text if c.isalpha())
        if total_alpha == 0:
            return False, 0.0

        polish_ratio = polish_count / total_alpha

        # For Polish text, we expect at least 2-5% Polish characters
        is_valid = polish_ratio >= 0.02 or polish_count > 0
        quality_score = min(1.0, polish_ratio * 20)  # Scale to 0-1

        return is_valid, quality_score


# Singleton instance
ocr_service = OCRService()
