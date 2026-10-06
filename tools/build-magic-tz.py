#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path

LEVELS = [
    (6, re.compile(r'^Эпическ', re.I)),
    (5, re.compile(r'^Грандмастерск|^Грандамастерск|^ГМ', re.I)),
    (4, re.compile(r'^Мастерск', re.I)),
    (3, re.compile(r'^Эспертн|^Экспертн', re.I)),
    (2, re.compile(r'^Продвинут', re.I)),
    (1, re.compile(r'^Базов', re.I)),
]

SCHOOLS = [
    ("Демонология", "Демонология"),
    ("Техномагия", "Техномагия"),
    ("Колдовство", "Колдовство"),
    ("Магия разума", "Магия разума"),
    ("Магия иллюзий", "Магия иллюзий"),
    ("Магия земли", "Магия земли"),
    ("Природа", "Магия природы"),
    ("Биомантия", "Биомантия (бионика)"),
    ("Воздух", "Магия воздуха"),
    ("Ритуалистика", "Ритуалистика"),
    ("Волшебство", "Волшебство"),
    ("Огонь", "Магия огня"),
    ("Вода", "Магия воды"),
    ("Магия льда", "Магия льда"),
    ("Священная (свет)", "Магия света (священная)"),
    ("Призыв", "Магия призыва"),
    ("Некромантия", "Некромантия"),
    ("Тени", "Магия теней (тьмы)"),
    ("Чума", "Чума"),
    ("Кровь", "Магия крови"),
    ("Разрушение", "Разрушение"),
    ("Рунная", "Рунная магия"),
    ("Поглощение", "Поглощение"),
    ("Антимагия", "Антимагия"),
    ("Магия войны", "Магия войны"),
    ("Металл", "Магия металла"),
    ("Шаманизм", "Шаманизм"),
    ("Инквизиторская", "Инквизиторская магия"),
    ("Пропаганда", "Пропаганда"),
    ("Солнечная", "Солнечная магия"),
    ("Вуду", "Вуду"),
    ("Астральная магия", "Астральная магия"),
    ("Ваагх!", "Ваагх"),
    ("Портальная", "Магия порталов"),
]

END_MARKERS = [
    "Энерговооружение и щиты доступны только отдельным технологичным мирам",
    "Энерговооружение и щиты доступны",
]

def normalize(text):
    text = text.replace("\r", "").replace("\ufeff", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def find_heading(lines, heading):
    wanted = heading.casefold()
    for i, line in enumerate(lines):
        clean = line.strip().casefold()
        if clean == wanted or clean.startswith(wanted + " -") or clean.startswith(wanted + " –") or clean.startswith(wanted + " —"):
            return i
    return -1

def clean_effect(text):
    text = normalize(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" -–—")

def split_levels(block):
    lines = block.splitlines()
    starts = []
    for i, line in enumerate(lines):
        clean = line.strip()
        if not clean:
            continue
        for level, pattern in LEVELS:
            if pattern.search(clean):
                starts.append((i, level))
                break
    if not starts:
        value = clean_effect(block)
        return [(None, value)] if value else []

    rows = []
    prefix = clean_effect("\n".join(lines[:starts[0][0]]))
    for n, (start, level) in enumerate(starts):
        end = starts[n + 1][0] if n + 1 < len(starts) else len(lines)
        value = clean_effect("\n".join(lines[start:end]))
        if value:
            rows.append((level, value))
    if prefix:
        rows.insert(0, (None, prefix))
    return rows

def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: build-magic-tz.py path/to/компиляция ВА34.pdf")
    pdf = Path(sys.argv[1])
    tmp = Path(".magic-tz-source.txt")
    subprocess.run(["pdftotext", "-layout", str(pdf), str(tmp)], check=True)
    text = tmp.read_text(encoding="utf-8").replace("\f", "\n")
    tmp.unlink(missing_ok=True)
    lines = text.splitlines()

    found = []
    for school, heading in SCHOOLS:
        idx = find_heading(lines, heading)
        if idx < 0:
            raise SystemExit(f"Не найден раздел магии: {heading}")
        found.append((idx, school, heading))
    found.sort()

    rows = []
    for pos, (idx, school, heading) in enumerate(found):
        next_idx = found[pos + 1][0] if pos + 1 < len(found) else len(lines)
        block = "\n".join(lines[idx + 1:next_idx])

        if pos == len(found) - 1:
            for marker in END_MARKERS:
                cut = block.find(marker)
                if cut >= 0:
                    block = block[:cut]
                    break

        for n, (level, effect) in enumerate(split_levels(block)):
            if not effect:
                continue
            req = None
            m = re.search(r"Требует(?:ся)?\s*[-–—:]\s*([^.;]+)", effect, re.I)
            if m:
                req = m.group(1).strip()
            rows.append({
                "id": f"magic-tz-{len(rows)+1}",
                "name": f"{school} — {['без уровня','экспертное','мастерское','грандмастерское','эпическое','эпическое'][level] if level else 'ТЗ из источника'}",
                "category": "magic_level",
                "school": school,
                "requiredLevel": level,
                "requirement": req,
                "effect": effect,
                "source": f"компиляция ВА34.pdf — раздел «{heading}»"
            })

    out = "/* Generated from source/компиляция ВА34.pdf. Do not edit manually. */\n"
    out += "window.VA34_MAGIC_TZ = " + json.dumps(rows, ensure_ascii=False, indent=2) + ";\n"
    Path("magic-tz-data.js").write_text(out, encoding="utf-8")
    print(f"generated {len(rows)} magic TZ entries")

if __name__ == "__main__":
    main()
