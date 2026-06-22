"""Counterparty risk scoring rules for INN Russia Bot.

The model follows the public logic used by banks and counterparty-checking
services: hard stop factors, weighted risk markers, and a 0-100 reliability
score. It only uses data currently available to the bot.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any


GREEN_THRESHOLD = 80
YELLOW_THRESHOLD = 50

HIGH_RISK_TAX_TOTAL = 100_000
CRITICAL_TAX_TOTAL = 1_000_000
HIGH_RISK_TAX_REVENUE_RATIO = 0.001
CRITICAL_TAX_REVENUE_RATIO = 0.01

HIGH_RISK_ARBITR_CASES = 10
HIGH_RISK_ARBITR_AMOUNT = 1_000_000
HIGH_RISK_ARBITR_REVENUE_RATIO = 0.02
HIGH_RISK_DEFENDANT_CASES = 3
HIGH_RISK_DEFENDANT_AMOUNT = 500_000
CRITICAL_DEFENDANT_AMOUNT = 2_000_000
HIGH_RISK_DEFENDANT_REVENUE_RATIO = 0.05
CRITICAL_DEFENDANT_REVENUE_RATIO = 0.15
HIGH_RISK_ENFORCEMENT_AMOUNT = 100_000
CRITICAL_ENFORCEMENT_AMOUNT = 1_000_000
HARD_STOP_ENFORCEMENT_AMOUNT = 5_000_000
HIGH_RISK_ENFORCEMENT_COUNT = 3

LARGE_REVENUE = 1_000_000_000
LARGE_EMPLOYEES = 1_000
LARGE_CAPITAL = 100_000_000

STATUS_RU = {
    "ACTIVE": "действующая",
    "LIQUIDATING": "ликвидируется",
    "LIQUIDATED": "ликвидирована",
    "BANKRUPT": "банкрот",
}


def to_number(value: Any) -> float:
    if value in (None, ""):
        return 0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        normalized = str(value).replace(" ", "").replace(",", ".")
        return float(normalized)
    except (TypeError, ValueError):
        return 0


def money_label(value: float) -> str:
    return f"{int(value):,}".replace(",", " ") + " руб."


def add_unique(items: list[str], text: str) -> None:
    if text and text not in items:
        items.append(text)


def add_marker(
    markers: list[dict[str, Any]],
    *,
    group: str,
    title: str,
    points: int,
    severity: str,
) -> None:
    markers.append({"group": group, "title": title, "points": points, "severity": severity})


def arbitr_total_amount(arbitr: dict[str, Any] | None) -> float:
    if not arbitr:
        return 0
    return sum(to_number(case.get("amount")) for case in arbitr.get("cases", []) or [])


def is_large_entity(result: dict[str, Any]) -> bool:
    return (
        to_number(result.get("revenue")) >= LARGE_REVENUE
        or to_number(result.get("employees")) >= LARGE_EMPLOYEES
        or to_number(result.get("capital")) >= LARGE_CAPITAL
    )


def company_age_years(result: dict[str, Any]) -> float | None:
    explicit_age = result.get("age_years")
    if explicit_age is not None:
        try:
            return max(float(explicit_age), 0)
        except (TypeError, ValueError):
            return None

    reg_date = result.get("reg_date")
    if not reg_date:
        return None
    try:
        timestamp = int(reg_date) / 1000
        registered = datetime.fromtimestamp(timestamp)
        return max((datetime.now() - registered).days / 365, 0)
    except (TypeError, ValueError, OSError):
        return None


def marker_titles(markers: list[dict[str, Any]], severity: str) -> list[str]:
    return [str(marker["title"]) for marker in markers if marker.get("severity") == severity]


def nested(source: dict[str, Any], *keys: str) -> dict[str, Any]:
    current: Any = source
    for key in keys:
        if not isinstance(current, dict):
            return {}
        current = current.get(key, {})
    return current if isinstance(current, dict) else {}


def assess_tax_due_diligence_risk(markers: list[dict[str, Any]], result: dict[str, Any]) -> dict[str, Any]:
    """Estimate tax reassessment / due diligence risk for the buyer.

    This is not a direct VAT-gap check. It is a proxy based on public markers
    that tax authorities commonly use when challenging deductions/expenses.
    """

    weights = {
        "bankruptcy": 35,
        "registry": 30,
        "legal_status": 30,
        "combined": 30,
        "tax": 25,
        "enforcement": 20,
        "operations": 15,
        "finance": 15,
        "litigation": 10,
        "maturity": 8,
    }
    score = 0
    reasons: list[str] = []
    seen_groups: set[str] = set()

    for marker in markers:
        group = str(marker.get("group", ""))
        title = str(marker.get("title", ""))
        severity = marker.get("severity")
        if not group:
            continue
        score += weights.get(group, 5)
        if severity == "red":
            score += 10
        if group not in seen_groups and title:
            reasons.append(title)
            seen_groups.add(group)

    if result.get("tax_debt") or result.get("penalty"):
        if "tax" not in seen_groups:
            reasons.append("есть налоговые долги/штрафы")
        score += 10

    score = max(0, min(100, score))
    if score >= 70:
        level = "high"
        label = "высокий"
    elif score >= 35:
        level = "medium"
        label = "средний"
    else:
        level = "low"
        label = "низкий"

    checklist = [
        "сохранить выписку ЕГРЮЛ/ЕГРИП на дату сделки",
        "проверить полномочия подписанта и реквизиты договора",
        "запросить подтверждение ресурсов для исполнения сделки",
        "сверить счета-фактуры, УПД, акты и платежи",
        "добавить налоговую оговорку в договор",
    ]
    if level == "high":
        checklist.insert(0, "запросить документы по реальности сделки до оплаты")
        checklist.insert(1, "рассмотреть предоплату/постоплату или отказ от сделки")

    return {
        "level": level,
        "label": label,
        "score": score,
        "reasons": reasons[:5],
        "checklist": checklist,
        "disclaimer": "Это прокси-оценка риска претензий ФНС, а не прямое выявление НДС-разрыва.",
    }


def assess_counterparty_risk(
    result: dict[str, Any],
    arbitr: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return a company result with reliability score, status, and reasons.

    Score meaning:
    - 80-100: GREEN, low visible risk;
    - 50-79: YELLOW, manual review is needed;
    - 0-49: RED, high risk or hard stop factors.

    A company can be YELLOW even with a high score when there are attention
    markers, e.g. routine arbitration for a large company.
    """

    assessed = deepcopy(result)
    if assessed.get("status") in {"ERROR", "NOT_FOUND", "TIMEOUT"}:
        return assessed

    risks = list(assessed.get("risks") or [])
    positive_factors = list(assessed.get("positive_factors") or assessed.get("positive_markers") or [])
    assessed["positive_markers"] = positive_factors
    markers: list[dict[str, Any]] = []
    hard_stops: list[str] = []
    hard_warnings: list[str] = []
    score = 100

    org_status = assessed.get("org_status")
    large_entity = is_large_entity(assessed)
    revenue = to_number(assessed.get("revenue"))
    capital = to_number(assessed.get("capital"))
    employees = to_number(assessed.get("employees"))

    if org_status == "ACTIVE":
        add_unique(positive_factors, "компания действует")
    if revenue > 0:
        add_unique(positive_factors, f"есть выручка: {money_label(revenue)}")
    if employees > 0:
        add_unique(positive_factors, f"есть сотрудники: {int(employees)}")
    if large_entity:
        add_unique(positive_factors, "крупный масштаб бизнеса")
    if assessed.get("no_enforcements"):
        add_unique(positive_factors, "нет исполнительных производств ФССП")
    if to_number(assessed.get("latest_profit")) > 0 or to_number(assessed.get("profit")) > 0:
        add_unique(positive_factors, "прибыль положительная")
    if assessed.get("reports_submitted"):
        add_unique(positive_factors, "отчетность сдается")

    if org_status and org_status != "ACTIVE":
        title = f"компания не действующая: {STATUS_RU.get(org_status, org_status)}"
        add_unique(risks, f"статус: {org_status}")
        points = 80 if org_status in {"LIQUIDATED", "BANKRUPT"} else 60
        add_marker(markers, group="legal_status", title=title, points=points, severity="red")
        if org_status in {"LIQUIDATED", "BANKRUPT", "LIQUIDATING", "INACTIVE"}:
            add_unique(hard_stops, title)

    if assessed.get("invalid") or assessed.get("invalid_address") or assessed.get("invalid_director") or "недостоверные сведения" in risks:
        add_unique(risks, "недостоверные сведения")
        add_marker(markers, group="registry", title="недостоверные сведения", points=45, severity="red")
        add_unique(hard_stops, "недостоверные сведения")

    if assessed.get("mass_director"):
        add_unique(risks, "массовый директор")
        add_marker(markers, group="registry", title="массовый директор", points=45, severity="red")
        add_unique(hard_stops, "массовый директор")

    if "адрес массовой регистрации" in risks:
        add_marker(markers, group="registry", title="адрес массовой регистрации", points=15, severity="yellow")

    age = company_age_years(assessed)
    if age is not None and age < 1:
        add_marker(markers, group="maturity", title="компания младше 1 года", points=12, severity="yellow")
        add_unique(hard_warnings, "компания младше 1 года")
    elif age is not None and age < 2:
        add_marker(markers, group="maturity", title="компания младше 2 лет", points=6, severity="yellow")
        add_unique(hard_warnings, "компания младше 2 лет")

    if capital and capital <= 10_000 and not large_entity:
        add_marker(markers, group="finance", title="минимальный уставный капитал", points=5, severity="yellow")

    if assessed.get("employees") in {0, "0"} and not large_entity:
        add_marker(markers, group="operations", title="нет данных о сотрудниках", points=5, severity="yellow")

    tax_debt = to_number(assessed.get("tax_debt"))
    penalty = to_number(assessed.get("penalty"))
    tax_total = tax_debt + penalty
    tax_ratio = tax_total / revenue if revenue else 0

    if tax_debt > 0:
        add_unique(risks, f"долги перед ФНС: {money_label(tax_debt)}")
    if penalty > 0:
        add_unique(risks, f"штрафы/пени ФНС: {money_label(penalty)}")
    if tax_total > 0:
        add_unique(hard_warnings, "есть задолженность перед ФНС")
        if tax_total >= CRITICAL_TAX_TOTAL or tax_ratio >= CRITICAL_TAX_REVENUE_RATIO:
            add_marker(markers, group="tax", title="критичная задолженность перед ФНС", points=45, severity="red")
            add_unique(hard_stops, "критичная задолженность перед ФНС")
        elif tax_total >= HIGH_RISK_TAX_TOTAL or tax_ratio >= HIGH_RISK_TAX_REVENUE_RATIO:
            add_marker(markers, group="tax", title="существенная задолженность перед ФНС", points=25, severity="red")
        else:
            add_marker(markers, group="tax", title="есть задолженность перед ФНС", points=10, severity="yellow")

    arbitr_count = int(to_number((arbitr or {}).get("count")))
    defendant_count = int(to_number((arbitr or {}).get("defendant_count")))
    plaintiff_count = int(to_number((arbitr or {}).get("plaintiff_count")))
    unknown_count = int(to_number((arbitr or {}).get("unknown_count")))
    defendant_amount = to_number((arbitr or {}).get("defendant_amount"))
    plaintiff_amount = to_number((arbitr or {}).get("plaintiff_amount"))
    unknown_amount = to_number((arbitr or {}).get("unknown_amount"))
    arbitr_amount = defendant_amount + plaintiff_amount + unknown_amount or arbitr_total_amount(arbitr)
    arbitr_ratio = arbitr_amount / revenue if revenue else 0
    defendant_ratio = defendant_amount / revenue if revenue else 0

    if arbitr_count > 0:
        add_unique(risks, f"арбитражные дела: {arbitr_count}")

    if defendant_count > 0 or defendant_amount > 0:
        if defendant_amount > 0:
            add_unique(risks, f"требования кредиторов к компании: {money_label(defendant_amount)}")
        else:
            add_unique(risks, f"компания ответчик в арбитраже: {defendant_count}")
        if defendant_count >= HIGH_RISK_DEFENDANT_CASES:
            add_unique(hard_warnings, "3+ арбитражных дела в роли ответчика")

        if large_entity and defendant_ratio < HIGH_RISK_DEFENDANT_REVENUE_RATIO:
            add_marker(
                markers,
                group="litigation",
                title="требования кредиторов к крупной компании в пределах масштаба",
                points=12,
                severity="yellow",
            )
        elif defendant_amount >= CRITICAL_DEFENDANT_AMOUNT or defendant_ratio >= CRITICAL_DEFENDANT_REVENUE_RATIO:
            add_marker(markers, group="litigation", title="критичные требования кредиторов к компании", points=45, severity="red")
        elif (
            defendant_amount >= HIGH_RISK_DEFENDANT_AMOUNT
            or defendant_ratio >= HIGH_RISK_DEFENDANT_REVENUE_RATIO
            or defendant_count >= HIGH_RISK_DEFENDANT_CASES
        ):
            add_marker(markers, group="litigation", title="существенные требования кредиторов к компании", points=30, severity="red")
        else:
            add_marker(markers, group="litigation", title="компания ответчик в арбитраже", points=12, severity="yellow")

    elif plaintiff_count > 0 and unknown_count == 0:
        assessed.setdefault("positive_markers", []).append(
            f"взыскивает через арбитраж: {money_label(plaintiff_amount)}" if plaintiff_amount else f"истец в арбитраже: {plaintiff_count}"
        )
        add_marker(markers, group="litigation", title="есть арбитраж в роли истца", points=3, severity="yellow")

    elif arbitr_count > 0:
        if large_entity and arbitr_ratio < HIGH_RISK_ARBITR_REVENUE_RATIO:
            add_marker(markers, group="litigation", title="есть арбитражные дела без роли", points=8, severity="yellow")
        elif arbitr_count >= HIGH_RISK_ARBITR_CASES:
            add_marker(markers, group="litigation", title="много арбитражных дел без роли", points=20, severity="red")
        elif arbitr_amount >= HIGH_RISK_ARBITR_AMOUNT:
            add_marker(markers, group="litigation", title="крупные суммы в арбитраже без роли", points=20, severity="red")
        else:
            add_marker(markers, group="litigation", title="есть арбитражные дела без роли", points=8, severity="yellow")

    if tax_total > 0 and (defendant_count > 0 or defendant_amount > 0 or arbitr_count > 0):
        add_unique(hard_warnings, "долги ФНС и судебные споры одновременно")
        if large_entity and tax_ratio < HIGH_RISK_TAX_REVENUE_RATIO and max(defendant_ratio, arbitr_ratio) < HIGH_RISK_ARBITR_REVENUE_RATIO:
            add_marker(markers, group="combined", title="есть долги ФНС и судебные споры", points=5, severity="yellow")
        else:
            add_marker(markers, group="combined", title="одновременно есть долги ФНС и требования кредиторов", points=35, severity="red")



    if assessed.get("financial_stability_risk"):
        add_marker(markers, group="finance", title="финансовая устойчивость: есть риски", points=10, severity="yellow")
        add_unique(hard_warnings, "финансовая устойчивость: есть риски")

    if assessed.get("negative_dynamics"):
        add_marker(markers, group="finance", title="отрицательная динамика", points=10, severity="yellow")
        add_unique(hard_warnings, "отрицательная динамика")

    revenue_drop = to_number(assessed.get("revenue_drop_percent"))
    if revenue_drop > 30:
        add_marker(markers, group="finance", title="падение выручки более 30%", points=12, severity="yellow")
        add_unique(hard_warnings, "падение выручки более 30%")

    business_value_drop = to_number(assessed.get("business_value_drop_percent"))
    if business_value_drop > 80:
        add_marker(markers, group="finance", title="падение стоимости бизнеса более 80%", points=12, severity="yellow")
        add_unique(hard_warnings, "падение стоимости бизнеса более 80%")

    moex = nested(assessed, "external", "moex") or nested(assessed, "moex")
    if moex.get("found"):
        assessed.setdefault("positive_markers", []).append("найдена в базе эмитентов/компаний MOEX")

    checko = nested(assessed, "external", "checko") or nested(assessed, "checko")
    if checko.get("enabled"):
        enforcements = nested(checko, "enforcements")
        enforcement_count = int(to_number(enforcements.get("count")))
        enforcement_amount = to_number(enforcements.get("total_amount"))
        if enforcement_count > 0:
            add_unique(risks, f"исполнительные производства ФССП: {enforcement_count}")
            if enforcement_amount >= HARD_STOP_ENFORCEMENT_AMOUNT:
                add_unique(hard_stops, "ФССП более 5 млн руб.")
            if enforcement_amount >= CRITICAL_ENFORCEMENT_AMOUNT or enforcement_count >= HIGH_RISK_ENFORCEMENT_COUNT:
                add_marker(markers, group="enforcement", title="существенные исполнительные производства", points=35, severity="red")
            elif enforcement_amount >= HIGH_RISK_ENFORCEMENT_AMOUNT:
                add_marker(markers, group="enforcement", title="исполнительные производства на значимую сумму", points=25, severity="red")
            else:
                add_marker(markers, group="enforcement", title="есть исполнительные производства", points=15, severity="yellow")

        bankruptcy = nested(checko, "bankruptcy_messages")
        if bankruptcy.get("has_signals") or to_number(bankruptcy.get("count")) > 0:
            add_unique(risks, "сообщения ЕФРСБ/Федресурс о банкротстве")
            add_marker(markers, group="bankruptcy", title="есть банкротные сообщения ЕФРСБ", points=80, severity="red")
            add_unique(hard_stops, "есть банкротные сообщения ЕФРСБ")

        finances = nested(checko, "finances")
        latest_revenue = to_number(finances.get("latest_revenue"))
        latest_profit = to_number(finances.get("latest_profit"))
        latest_capital = to_number(finances.get("latest_capital"))
        if latest_profit > 0:
            add_unique(positive_factors, "прибыль положительная")
        if finances.get("reports_submitted"):
            add_unique(positive_factors, "отчетность сдается")
        if not revenue and latest_revenue:
            revenue = latest_revenue
            assessed["revenue"] = latest_revenue
        if latest_profit < 0:
            add_marker(markers, group="finance", title="убыток по последней отчетности", points=10, severity="yellow")
        if latest_capital < 0:
            add_marker(markers, group="finance", title="отрицательный капитал по отчетности", points=30, severity="red")

        contracts = nested(checko, "contracts")
        contract_count = int(to_number(contracts.get("count")))
        if contract_count > 0:
            assessed.setdefault("positive_markers", []).append(f"есть госконтракты: {contract_count}")

    score -= sum(int(marker["points"]) for marker in markers)
    score = max(0, min(100, score))

    red_reasons = marker_titles(markers, "red")
    yellow_reasons = marker_titles(markers, "yellow")

    assessed["risks"] = risks
    assessed["risk_score"] = score
    assessed["risk_markers"] = markers
    assessed["hard_stops"] = hard_stops
    assessed["hard_warnings"] = hard_warnings
    assessed["risk_reasons"] = hard_stops or red_reasons or hard_warnings or yellow_reasons
    assessed["positive_factors"] = list(assessed.get("positive_markers") or [])
    assessed["tax_due_diligence_risk"] = assess_tax_due_diligence_risk(markers, assessed)

    if hard_stops or red_reasons or score < YELLOW_THRESHOLD:
        assessed["status"] = "RED"
        assessed["risk_level"] = "high"
    elif hard_warnings or yellow_reasons or score < GREEN_THRESHOLD:
        assessed["status"] = "YELLOW"
        assessed["risk_level"] = "medium"
    else:
        assessed["status"] = "GREEN"
        assessed["risk_level"] = "low"

    return assessed

def calculate_risk_score(company: dict[str, Any]) -> dict[str, Any]:
    """Score a compact offline benchmark fixture.

    This helper is intentionally API-free: tests can describe real companies with
    normalized facts such as tax debt and defendant arbitration counts without
    calling DaData, Checko, KAD, or any paid source.
    """

    result = deepcopy(company)
    status = result.get("status")
    if status in {"ACTIVE", "LIQUIDATING", "LIQUIDATED", "BANKRUPT", "INACTIVE"}:
        result["org_status"] = status
        result.pop("status", None)

    tax_debt = result.get("tax_debt")
    if isinstance(tax_debt, bool):
        result["tax_debt"] = 1 if tax_debt else 0

    arbitr = {
        "count": result.pop("arbitration_count", result.pop("arbitr_count", 0)),
        "defendant_count": result.pop("arbitration_defendant_count", result.pop("defendant_count", 0)),
        "plaintiff_count": result.pop("arbitration_plaintiff_count", result.pop("plaintiff_count", 0)),
        "unknown_count": result.pop("arbitration_unknown_count", result.pop("unknown_count", 0)),
        "defendant_amount": result.pop("arbitration_defendant_amount", result.pop("defendant_amount", 0)),
        "plaintiff_amount": result.pop("arbitration_plaintiff_amount", result.pop("plaintiff_amount", 0)),
        "unknown_amount": result.pop("arbitration_unknown_amount", result.pop("unknown_amount", 0)),
    }

    if not arbitr["count"]:
        arbitr["count"] = arbitr["defendant_count"] + arbitr["plaintiff_count"] + arbitr["unknown_count"]

    assessed = assess_counterparty_risk(result, arbitr)
    assessed["zone"] = assessed.get("status")
    return assessed
