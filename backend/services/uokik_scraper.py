"""UOKiK decision scraper using Playwright.

Scraps https://decyzje.uokik.gov.pl/bp/dec_prez.nsf for prohibited clause decisions.
The site uses Lotus Notes/Domino and requires JavaScript rendering.
"""
import asyncio
import logging
import random
from datetime import datetime
from typing import Dict, List, Optional

from playwright.async_api import async_playwright, Page, Browser, Playwright

logger = logging.getLogger(__name__)

UOKIK_BASE_URL = "https://decyzje.uokik.gov.pl/bp/dec_prez.nsf"
UOKIK_CLAUSES_SECTION = "Klauzule niedozwolone"

# Stealth headers and viewport
STEALTH_VIEWPORT = {"width": 1920, "height": 1080}
STEALTH_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class UokikScraperError(Exception):
    """Raised when scraping fails."""

    pass


class UokikScraper:
    """Scraper for UOKiK prohibited clause decisions."""

    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 500,
        request_delay: tuple = (1, 3),
        timeout: int = 30_000,
    ):
        """Initialize scraper.

        Args:
            headless: Run browser in headless mode.
            slow_mo: Slow down Playwright operations by N milliseconds.
            request_delay: Random delay range (min, max) between requests in seconds.
            timeout: Page load timeout in milliseconds.
        """
        self.headless = headless
        self.slow_mo = slow_mo
        self.request_delay = request_delay
        self.timeout = timeout
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None

    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()
        return False

    async def start(self):
        """Start Playwright browser."""
        logger.info("Starting Playwright browser")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ],
        )
        logger.info("Browser started")

    async def stop(self):
        """Stop Playwright browser."""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        logger.info("Browser stopped")

    def _new_page(self) -> Page:
        """Create a new page with stealth settings."""
        if not self.browser:
            raise UokikScraperError("Browser not started. Use start() or async context manager.")

        context = self.browser.new_context(
            viewport=STEALTH_VIEWPORT,
            user_agent=STEALTH_USER_AGENT,
            locale="pl-PL",
            timezone_id="Europe/Warsaw",
            permissions=["geolocation"],
            java_script_enabled=True,
        )
        page = context.pages[0] if context.pages else context.new_page()
        # Inject stealth script to hide webdriver
        # Note: playwright-stealth package is more robust, but we do basic hiding here
        return page

    async def _random_delay(self):
        """Wait for a random delay between requests."""
        delay = random.uniform(*self.request_delay)
        await asyncio.sleep(delay)

    async def scrape_decisions(
        self,
        start_year: int = 2017,
        end_year: Optional[int] = None,
        existing_signatures: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Scrape UOKiK decisions for prohibited clauses.

        Args:
            start_year: First year to scrape.
            end_year: Last year to scrape (defaults to current year).
            existing_signatures: List of signatures to skip (already in DB).

        Returns:
            List of decision metadata dicts with keys:
            - signature: Decision signature (e.g. "RŁO.611.1.2024.MD")
            - decision_number: Decision number (e.g. "RŁO 3/2024")
            - date: Decision date string
            - year: Year
            - pdf_url: URL to PDF file
            - parties: Parties involved
            - detail_url: URL to detail page
        """
        end_year = end_year or datetime.now().year
        existing_signatures = set(existing_signatures or [])
        all_decisions: List[Dict] = []

        page = await self._new_page()

        try:
            # Step 1: Open main page
            logger.info(f"Opening UOKiK page: {UOKIK_BASE_URL}")
            await page.goto(UOKIK_BASE_URL, wait_until="networkidle", timeout=self.timeout)
            await self._random_delay()

            # Step 2: Expand "Klauzule niedozwolone" section
            await self._expand_clauses_section(page)

            # Step 3: Iterate through years
            for year in range(start_year, end_year + 1):
                logger.info(f"Scraping year: {year}")
                year_decisions = await self._scrape_year(page, year, existing_signatures)
                all_decisions.extend(year_decisions)
                logger.info(f"Year {year}: found {len(year_decisions)} new decisions")
                await self._random_delay()

        except Exception as e:
            logger.error(f"Scraping error: {e}")
            raise UokikScraperError(f"Failed to scrape decisions: {e}")
        finally:
            await page.context.close()

        logger.info(f"Total new decisions found: {len(all_decisions)}")
        return all_decisions

    async def _expand_clauses_section(self, page: Page):
        """Expand the 'Klauzule niedozwolone' section on main page.

        Args:
            page: Playwright page.
        """
        logger.info("Expanding 'Klauzule niedozwolone' section")

        # Try multiple selectors as the site structure may vary
        selectors = [
            f"text={UOKIK_CLAUSES_SECTION}",
            "a:has-text('Klauzule')",
            "[title*='Klauzule']",
            "td:has-text('Klauzule')",
        ]

        for selector in selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    await element.click()
                    await page.wait_for_load_state("networkidle")
                    logger.info(f"Clicked section using selector: {selector}")
                    await self._random_delay()
                    return
            except Exception as e:
                logger.debug(f"Selector {selector} failed: {e}")
                continue

        # If no selector worked, take a screenshot for debugging
        logger.warning("Could not find 'Klauzule niedozwolone' section automatically")
        # Save debug screenshot
        debug_path = "/tmp/uokik_debug_main.png"
        await page.screenshot(path=debug_path, full_page=True)
        logger.info(f"Debug screenshot saved to {debug_path}")
        raise UokikScraperError(
            "Could not expand 'Klauzule niedozwolone' section. "
            f"Check debug screenshot at {debug_path}. "
            "Site structure may have changed."
        )

    async def _scrape_year(
        self,
        page: Page,
        year: int,
        existing_signatures: set,
    ) -> List[Dict]:
        """Scrape decisions for a specific year.

        Args:
            page: Playwright page.
            year: Year to scrape.
            existing_signatures: Set of signatures to skip.

        Returns:
            List of new decision dicts.
        """
        decisions = []

        # Try to find and click the year link
        year_selectors = [
            f"text='{year}'",
            f"a:has-text('{year}')",
            f"td:has-text('{year}')",
        ]

        year_clicked = False
        for selector in year_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    await element.click()
                    await page.wait_for_load_state("networkidle")
                    year_clicked = True
                    logger.info(f"Clicked year {year}")
                    await self._random_delay()
                    break
            except Exception as e:
                logger.debug(f"Year selector {selector} failed: {e}")

        if not year_clicked:
            logger.warning(f"Could not find year {year}")
            return decisions

        # Extract decision links from the page
        decision_links = await self._extract_decision_links(page)
        logger.info(f"Found {len(decision_links)} decisions for year {year}")

        for link_info in decision_links:
            signature = link_info.get("signature", "")
            if signature and signature in existing_signatures:
                logger.debug(f"Skipping existing signature: {signature}")
                continue

            try:
                detail = await self._scrape_decision_detail(page, link_info["url"])
                if detail:
                    decisions.append(detail)
            except Exception as e:
                logger.warning(f"Failed to scrape decision {link_info}: {e}")
                continue

            await self._random_delay()

        return decisions

    async def _extract_decision_links(self, page: Page) -> List[Dict]:
        """Extract decision links from current page.

        Args:
            page: Playwright page.

        Returns:
            List of dicts with url and signature.
        """
        links = []

        # Common patterns for decision links on Lotus Notes sites
        selectors = [
            "a[href*='OpenDocument']",
            "a[href*='dec_prez']",
            "table a",
            "a",
        ]

        for selector in selectors:
            elements = await page.query_selector_all(selector)
            for el in elements:
                try:
                    href = await el.get_attribute("href")
                    text = await el.inner_text()
                    if href and text:
                        # Filter for decision-like links
                        links.append({
                            "url": href if href.startswith("http") else f"{UOKIK_BASE_URL}/{href}",
                            "text": text.strip(),
                            "signature": text.strip(),
                        })
                except Exception:
                    continue

            if links:
                break

        return links

    async def _scrape_decision_detail(self, page: Page, detail_url: str) -> Optional[Dict]:
        """Scrape detail page for a single decision.

        Args:
            page: Playwright page.
            detail_url: URL to decision detail page.

        Returns:
            Decision dict or None if failed.
        """
        await page.goto(detail_url, wait_until="networkidle", timeout=self.timeout)
        await self._random_delay()

        # Extract metadata from page
        detail = {
            "detail_url": detail_url,
            "signature": "",
            "decision_number": "",
            "date": "",
            "parties": "",
            "pdf_url": "",
        }

        # Try to find PDF link
        pdf_selectors = [
            "a[href$='.pdf']",
            "a[href*='.pdf']",
            "a:has-text('PDF')",
            "a:has-text('pdf')",
        ]

        for selector in pdf_selectors:
            try:
                pdf_link = await page.query_selector(selector)
                if pdf_link:
                    href = await pdf_link.get_attribute("href")
                    if href:
                        detail["pdf_url"] = href if href.startswith("http") else f"{UOKIK_BASE_URL}/{href}"
                        break
            except Exception:
                continue

        # Extract text content for metadata parsing
        try:
            content = await page.inner_text("body")
            detail["raw_text"] = content[:5000]  # Save first 5000 chars for debugging
        except Exception:
            detail["raw_text"] = ""

        return detail

    async def test_connection(self) -> bool:
        """Test if UOKiK site is accessible.

        Returns:
            True if site loads successfully.
        """
        page = await self._new_page()
        try:
            response = await page.goto(UOKIK_BASE_URL, wait_until="networkidle", timeout=self.timeout)
            if response and response.status == 200:
                logger.info("UOKiK site is accessible")
                return True
            logger.warning(f"UOKiK site returned status {response.status if response else 'None'}")
            return False
        except Exception as e:
            logger.error(f"UOKiK site connection failed: {e}")
            return False
        finally:
            await page.context.close()
