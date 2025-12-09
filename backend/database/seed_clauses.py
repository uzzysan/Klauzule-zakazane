"""Seed script for prohibited clauses database."""
import asyncio
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import AsyncSessionLocal
from models.clause import ClauseCategory, LegalReference, ProhibitedClause


# Categories for prohibited clauses
CATEGORIES = [
    {
        "code": "unfair_arbitration",
        "name_en": "Unfair Arbitration",
        "name_pl": "Nieuczciwy arbitraż",
        "description_en": "Clauses limiting dispute resolution rights",
        "description_pl": "Klauzule ograniczające prawa do rozstrzygania sporów",
        "default_risk_level": "high",
    },
    {
        "code": "liability_waiver",
        "name_en": "Liability Waiver",
        "name_pl": "Zrzeczenie odpowiedzialności",
        "description_en": "Clauses that unfairly limit seller liability",
        "description_pl": "Klauzule niesprawiedliwie ograniczające odpowiedzialność sprzedawcy",
        "default_risk_level": "high",
    },
    {
        "code": "hidden_fees",
        "name_en": "Hidden Fees",
        "name_pl": "Ukryte opłaty",
        "description_en": "Non-transparent cost clauses",
        "description_pl": "Nieprzejrzyste klauzule kosztowe",
        "default_risk_level": "medium",
    },
    {
        "code": "unilateral_change",
        "name_en": "Unilateral Changes",
        "name_pl": "Jednostronne zmiany",
        "description_en": "Right to change terms without notice",
        "description_pl": "Prawo do zmiany warunków bez uprzedzenia",
        "default_risk_level": "high",
    },
    {
        "code": "withdrawal_restriction",
        "name_en": "Withdrawal Restrictions",
        "name_pl": "Ograniczenie prawa odstąpienia",
        "description_en": "Clauses limiting consumer withdrawal rights",
        "description_pl": "Klauzule ograniczające prawo konsumenta do odstąpienia od umowy",
        "default_risk_level": "high",
    },
    {
        "code": "automatic_renewal",
        "name_en": "Automatic Renewal",
        "name_pl": "Automatyczne przedłużenie",
        "description_en": "Automatic contract renewal without consent",
        "description_pl": "Automatyczne przedłużenie umowy bez zgody",
        "default_risk_level": "medium",
    },
    {
        "code": "jurisdiction_clause",
        "name_en": "Jurisdiction Clause",
        "name_pl": "Klauzula właściwości sądu",
        "description_en": "Clauses imposing inconvenient jurisdiction",
        "description_pl": "Klauzule narzucające niedogodną właściwość sądu",
        "default_risk_level": "medium",
    },
    {
        "code": "penalty_clause",
        "name_en": "Excessive Penalties",
        "name_pl": "Nadmierne kary umowne",
        "description_en": "Disproportionate penalties for consumers",
        "description_pl": "Nieproporcjonalne kary dla konsumentów",
        "default_risk_level": "high",
    },
    {
        "code": "data_usage",
        "name_en": "Excessive Data Usage",
        "name_pl": "Nadmierne wykorzystanie danych",
        "description_en": "Broad data processing without clear consent",
        "description_pl": "Szerokie przetwarzanie danych bez wyraźnej zgody",
        "default_risk_level": "medium",
    },
    {
        "code": "warranty_limitation",
        "name_en": "Warranty Limitation",
        "name_pl": "Ograniczenie gwarancji",
        "description_en": "Unfair limitations on warranty rights",
        "description_pl": "Nieuczciwe ograniczenia praw gwarancyjnych",
        "default_risk_level": "high",
    },
]

# Legal references
LEGAL_REFERENCES = [
    {
        "article_code": "Art. 385¹ KC",
        "article_title": "Niedozwolone postanowienia umowne",
        "description": "Postanowienia umowy zawieranej z konsumentem nieuzgodnione indywidualnie nie wiążą go, jeżeli kształtują jego prawa i obowiązki w sposób sprzeczny z dobrymi obyczajami, rażąco naruszając jego interesy.",
        "law_name": "Kodeks cywilny",
        "jurisdiction": "PL",
    },
    {
        "article_code": "Art. 385³ KC",
        "article_title": "Katalog klauzul niedozwolonych",
        "description": "W razie wątpliwości uważa się, że niedozwolonymi postanowieniami umownymi są te, które...",
        "law_name": "Kodeks cywilny",
        "jurisdiction": "PL",
    },
    {
        "article_code": "Art. 27 PrKons",
        "article_title": "Prawo odstąpienia od umowy",
        "description": "Konsument, który zawarł umowę na odległość lub poza lokalem przedsiębiorstwa, może w terminie 14 dni odstąpić od niej bez podawania przyczyny.",
        "law_name": "Ustawa o prawach konsumenta",
        "jurisdiction": "PL",
    },
    {
        "article_code": "Art. 556 KC",
        "article_title": "Rękojmia za wady",
        "description": "Sprzedawca jest odpowiedzialny względem kupującego, jeżeli rzecz sprzedana ma wadę fizyczną lub prawną.",
        "law_name": "Kodeks cywilny",
        "jurisdiction": "PL",
    },
]

# Prohibited clauses - Polish consumer law
PROHIBITED_CLAUSES = [
    # Liability waiver clauses
    {
        "clause_text": "Sprzedawca nie ponosi odpowiedzialności za wady towaru",
        "normalized_text": "sprzedawca nie ponosi odpowiedzialności za wady towaru",
        "category_code": "liability_waiver",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Wyłącza się odpowiedzialność sprzedawcy z tytułu rękojmi",
        "normalized_text": "wyłącza się odpowiedzialność sprzedawcy z tytułu rękojmi",
        "category_code": "liability_waiver",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Reklamacje nie będą uwzględniane po upływie 7 dni od zakupu",
        "normalized_text": "reklamacje nie będą uwzględniane po upływie 7 dni od zakupu",
        "category_code": "liability_waiver",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Firma nie odpowiada za szkody powstałe w wyniku korzystania z produktu",
        "normalized_text": "firma nie odpowiada za szkody powstałe w wyniku korzystania z produktu",
        "category_code": "liability_waiver",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Wszelkie roszczenia odszkodowawcze są wyłączone",
        "normalized_text": "wszelkie roszczenia odszkodowawcze są wyłączone",
        "category_code": "liability_waiver",
        "risk_level": "high",
        "language": "pl",
    },

    # Withdrawal restriction clauses
    {
        "clause_text": "Klient nie ma prawa do odstąpienia od umowy",
        "normalized_text": "klient nie ma prawa do odstąpienia od umowy",
        "category_code": "withdrawal_restriction",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Zwrot towaru jest możliwy wyłącznie w ciągu 3 dni od zakupu",
        "normalized_text": "zwrot towaru jest możliwy wyłącznie w ciągu 3 dni od zakupu",
        "category_code": "withdrawal_restriction",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Odstąpienie od umowy wymaga zgody sprzedawcy",
        "normalized_text": "odstąpienie od umowy wymaga zgody sprzedawcy",
        "category_code": "withdrawal_restriction",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "W przypadku odstąpienia od umowy klient traci wpłacone środki",
        "normalized_text": "w przypadku odstąpienia od umowy klient traci wpłacone środki",
        "category_code": "withdrawal_restriction",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Prawo do zwrotu nie przysługuje w przypadku promocji",
        "normalized_text": "prawo do zwrotu nie przysługuje w przypadku promocji",
        "category_code": "withdrawal_restriction",
        "risk_level": "high",
        "language": "pl",
    },

    # Unilateral change clauses
    {
        "clause_text": "Sprzedawca zastrzega sobie prawo do zmiany ceny bez uprzedzenia",
        "normalized_text": "sprzedawca zastrzega sobie prawo do zmiany ceny bez uprzedzenia",
        "category_code": "unilateral_change",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Regulamin może ulec zmianie w każdym czasie",
        "normalized_text": "regulamin może ulec zmianie w każdym czasie",
        "category_code": "unilateral_change",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Usługodawca może jednostronnie zmienić warunki umowy",
        "normalized_text": "usługodawca może jednostronnie zmienić warunki umowy",
        "category_code": "unilateral_change",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Firma zastrzega prawo do modyfikacji zakresu usług",
        "normalized_text": "firma zastrzega prawo do modyfikacji zakresu usług",
        "category_code": "unilateral_change",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Cennik może ulec zmianie bez konieczności powiadamiania klienta",
        "normalized_text": "cennik może ulec zmianie bez konieczności powiadamiania klienta",
        "category_code": "unilateral_change",
        "risk_level": "high",
        "language": "pl",
    },

    # Hidden fees clauses
    {
        "clause_text": "Dodatkowe opłaty zostaną naliczone zgodnie z aktualnym cennikiem",
        "normalized_text": "dodatkowe opłaty zostaną naliczone zgodnie z aktualnym cennikiem",
        "category_code": "hidden_fees",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Klient zostanie obciążony kosztami obsługi",
        "normalized_text": "klient zostanie obciążony kosztami obsługi",
        "category_code": "hidden_fees",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Opłata aktywacyjna jest bezzwrotna",
        "normalized_text": "opłata aktywacyjna jest bezzwrotna",
        "category_code": "hidden_fees",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Do ceny doliczane są koszty administracyjne",
        "normalized_text": "do ceny doliczane są koszty administracyjne",
        "category_code": "hidden_fees",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Prowizja od transakcji wynosi do 10% wartości zamówienia",
        "normalized_text": "prowizja od transakcji wynosi do 10% wartości zamówienia",
        "category_code": "hidden_fees",
        "risk_level": "medium",
        "language": "pl",
    },

    # Unfair arbitration clauses
    {
        "clause_text": "Wszelkie spory będą rozstrzygane przez sąd polubowny wybrany przez sprzedawcę",
        "normalized_text": "wszelkie spory będą rozstrzygane przez sąd polubowny wybrany przez sprzedawcę",
        "category_code": "unfair_arbitration",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Klient zrzeka się prawa do dochodzenia roszczeń przed sądem powszechnym",
        "normalized_text": "klient zrzeka się prawa do dochodzenia roszczeń przed sądem powszechnym",
        "category_code": "unfair_arbitration",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Spory rozstrzygane są wyłącznie w drodze negocjacji",
        "normalized_text": "spory rozstrzygane są wyłącznie w drodze negocjacji",
        "category_code": "unfair_arbitration",
        "risk_level": "medium",
        "language": "pl",
    },

    # Jurisdiction clauses
    {
        "clause_text": "Sądem właściwym jest sąd w miejscu siedziby sprzedawcy",
        "normalized_text": "sądem właściwym jest sąd w miejscu siedziby sprzedawcy",
        "category_code": "jurisdiction_clause",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Właściwym do rozstrzygania sporów jest sąd w Warszawie",
        "normalized_text": "właściwym do rozstrzygania sporów jest sąd w warszawie",
        "category_code": "jurisdiction_clause",
        "risk_level": "medium",
        "language": "pl",
    },

    # Automatic renewal clauses
    {
        "clause_text": "Umowa ulega automatycznemu przedłużeniu na kolejny okres",
        "normalized_text": "umowa ulega automatycznemu przedłużeniu na kolejny okres",
        "category_code": "automatic_renewal",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Brak wypowiedzenia oznacza zgodę na przedłużenie umowy",
        "normalized_text": "brak wypowiedzenia oznacza zgodę na przedłużenie umowy",
        "category_code": "automatic_renewal",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Subskrypcja odnawia się automatycznie",
        "normalized_text": "subskrypcja odnawia się automatycznie",
        "category_code": "automatic_renewal",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Rezygnacja wymaga pisemnego wypowiedzenia na 30 dni przed końcem okresu",
        "normalized_text": "rezygnacja wymaga pisemnego wypowiedzenia na 30 dni przed końcem okresu",
        "category_code": "automatic_renewal",
        "risk_level": "low",
        "language": "pl",
    },

    # Penalty clauses
    {
        "clause_text": "W przypadku rozwiązania umowy klient zapłaci karę w wysokości 100% wartości umowy",
        "normalized_text": "w przypadku rozwiązania umowy klient zapłaci karę w wysokości 100% wartości umowy",
        "category_code": "penalty_clause",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Za opóźnienie w płatności naliczane są odsetki w wysokości 50% rocznie",
        "normalized_text": "za opóźnienie w płatności naliczane są odsetki w wysokości 50% rocznie",
        "category_code": "penalty_clause",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Kara umowna za wcześniejsze rozwiązanie umowy wynosi trzykrotność miesięcznej opłaty",
        "normalized_text": "kara umowna za wcześniejsze rozwiązanie umowy wynosi trzykrotność miesięcznej opłaty",
        "category_code": "penalty_clause",
        "risk_level": "high",
        "language": "pl",
    },

    # Data usage clauses
    {
        "clause_text": "Dane osobowe mogą być przekazywane podmiotom trzecim w celach marketingowych",
        "normalized_text": "dane osobowe mogą być przekazywane podmiotom trzecim w celach marketingowych",
        "category_code": "data_usage",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Klient wyraża zgodę na przetwarzanie danych w dowolnym celu",
        "normalized_text": "klient wyraża zgodę na przetwarzanie danych w dowolnym celu",
        "category_code": "data_usage",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Firma ma prawo do wykorzystania wizerunku klienta bez dodatkowej zgody",
        "normalized_text": "firma ma prawo do wykorzystania wizerunku klienta bez dodatkowej zgody",
        "category_code": "data_usage",
        "risk_level": "high",
        "language": "pl",
    },

    # Warranty limitation clauses
    {
        "clause_text": "Gwarancja nie obejmuje wad powstałych w wyniku normalnego użytkowania",
        "normalized_text": "gwarancja nie obejmuje wad powstałych w wyniku normalnego użytkowania",
        "category_code": "warranty_limitation",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Okres gwarancji wynosi 3 miesiące",
        "normalized_text": "okres gwarancji wynosi 3 miesiące",
        "category_code": "warranty_limitation",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Rękojmia za wady fizyczne jest wyłączona",
        "normalized_text": "rękojmia za wady fizyczne jest wyłączona",
        "category_code": "warranty_limitation",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Naprawa gwarancyjna możliwa tylko w autoryzowanym serwisie",
        "normalized_text": "naprawa gwarancyjna możliwa tylko w autoryzowanym serwisie",
        "category_code": "warranty_limitation",
        "risk_level": "medium",
        "language": "pl",
    },

    # Additional clauses
    {
        "clause_text": "Sprzedawca nie ponosi odpowiedzialności za opóźnienia w dostawie",
        "normalized_text": "sprzedawca nie ponosi odpowiedzialności za opóźnienia w dostawie",
        "category_code": "liability_waiver",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Towar nieodesłany w ciągu 14 dni uznaje się za zaakceptowany",
        "normalized_text": "towar nieodesłany w ciągu 14 dni uznaje się za zaakceptowany",
        "category_code": "withdrawal_restriction",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Sklep zastrzega sobie prawo do anulowania zamówienia bez podania przyczyny",
        "normalized_text": "sklep zastrzega sobie prawo do anulowania zamówienia bez podania przyczyny",
        "category_code": "unilateral_change",
        "risk_level": "high",
        "language": "pl",
    },
    {
        "clause_text": "Cena może zostać zmieniona w przypadku błędu systemowego",
        "normalized_text": "cena może zostać zmieniona w przypadku błędu systemowego",
        "category_code": "unilateral_change",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Klient jest zobowiązany do sprawdzenia przesyłki w obecności kuriera",
        "normalized_text": "klient jest zobowiązany do sprawdzenia przesyłki w obecności kuriera",
        "category_code": "withdrawal_restriction",
        "risk_level": "low",
        "language": "pl",
    },
    {
        "clause_text": "Zwroty przyjmowane są wyłącznie w oryginalnym opakowaniu",
        "normalized_text": "zwroty przyjmowane są wyłącznie w oryginalnym opakowaniu",
        "category_code": "withdrawal_restriction",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Firma nie odpowiada za utratę danych użytkownika",
        "normalized_text": "firma nie odpowiada za utratę danych użytkownika",
        "category_code": "liability_waiver",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Maksymalna wysokość odszkodowania ograniczona jest do wartości zakupu",
        "normalized_text": "maksymalna wysokość odszkodowania ograniczona jest do wartości zakupu",
        "category_code": "liability_waiver",
        "risk_level": "medium",
        "language": "pl",
    },
    {
        "clause_text": "Termin realizacji ma charakter orientacyjny i nie jest wiążący",
        "normalized_text": "termin realizacji ma charakter orientacyjny i nie jest wiążący",
        "category_code": "liability_waiver",
        "risk_level": "low",
        "language": "pl",
    },
    {
        "clause_text": "Sprzedawca nie ponosi odpowiedzialności za działanie siły wyższej",
        "normalized_text": "sprzedawca nie ponosi odpowiedzialności za działanie siły wyższej",
        "category_code": "liability_waiver",
        "risk_level": "low",
        "language": "pl",
    },
]


async def seed_categories(session: AsyncSession) -> dict:
    """Seed clause categories and return mapping of code to id."""
    category_map = {}

    for cat_data in CATEGORIES:
        # Check if category exists
        result = await session.execute(
            select(ClauseCategory).where(ClauseCategory.code == cat_data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            category_map[cat_data["code"]] = existing.id
            continue

        category = ClauseCategory(
            id=uuid4(),
            code=cat_data["code"],
            name_en=cat_data["name_en"],
            name_pl=cat_data["name_pl"],
            description_en=cat_data.get("description_en"),
            description_pl=cat_data.get("description_pl"),
            default_risk_level=cat_data["default_risk_level"],
        )
        session.add(category)
        await session.flush()
        category_map[cat_data["code"]] = category.id

    return category_map


async def seed_legal_references(session: AsyncSession) -> dict:
    """Seed legal references and return mapping of code to id."""
    ref_map = {}

    for ref_data in LEGAL_REFERENCES:
        # Check if reference exists
        result = await session.execute(
            select(LegalReference).where(LegalReference.article_code == ref_data["article_code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            ref_map[ref_data["article_code"]] = existing.id
            continue

        ref = LegalReference(
            id=uuid4(),
            article_code=ref_data["article_code"],
            article_title=ref_data.get("article_title"),
            description=ref_data["description"],
            law_name=ref_data["law_name"],
            jurisdiction=ref_data.get("jurisdiction", "PL"),
        )
        session.add(ref)
        await session.flush()
        ref_map[ref_data["article_code"]] = ref.id

    return ref_map


async def seed_clauses(session: AsyncSession, category_map: dict) -> int:
    """Seed prohibited clauses. Returns count of new clauses added."""
    count = 0

    for clause_data in PROHIBITED_CLAUSES:
        # Check if clause exists (by normalized text)
        result = await session.execute(
            select(ProhibitedClause).where(
                ProhibitedClause.normalized_text == clause_data["normalized_text"]
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            continue

        category_id = category_map.get(clause_data["category_code"])
        if not category_id:
            print(f"Warning: Category {clause_data['category_code']} not found")
            continue

        clause = ProhibitedClause(
            id=uuid4(),
            category_id=category_id,
            clause_text=clause_data["clause_text"],
            normalized_text=clause_data["normalized_text"],
            risk_level=clause_data["risk_level"],
            language=clause_data.get("language", "pl"),
            source="standard",
            confidence=1.0,
        )
        session.add(clause)
        count += 1

    return count


async def run_seed():
    """Run the seed script."""
    async with AsyncSessionLocal() as session:
        print("Seeding clause categories...")
        category_map = await seed_categories(session)
        print(f"  {len(category_map)} categories ready")

        print("Seeding legal references...")
        ref_map = await seed_legal_references(session)
        print(f"  {len(ref_map)} references ready")

        print("Seeding prohibited clauses...")
        clause_count = await seed_clauses(session, category_map)
        print(f"  {clause_count} new clauses added")

        await session.commit()
        print("Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(run_seed())
