"""Import the November 4 equipment descriptions and reference original PNGs."""
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Sản phẩm thêm mới' / 'Cập nhật thiết bị 4-11'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
IMAGES = [
    'Gậy cảnh báo.png', 'Đèn măng xông.png', 'Loa cầm tay.png',
    'Cuộn rào chắn.png', 'Nón bảo hộ.png', 'Dây đeo Phản Quang.png',
    'Ổ cắm điện tròn.png', 'dây đèn LED.png', 'Dù Bánh Ú.png', 'Đèn dầu điện.png',
]


def main():
    with ZipFile(next(SOURCE.glob('*.docx'))) as archive:
        document = ET.fromstring(archive.read('word/document.xml'))
    paragraphs = [
        ''.join(t.text or '' for t in p.findall('.//w:t', NS)).strip()
        for p in document.findall('.//w:p', NS)
    ]
    paragraphs = [p for p in paragraphs if p]
    starts = [i for i, p in enumerate(paragraphs) if re.match(r'^\d+\.', p)]
    assert len(starts) == len(IMAGES) == 10
    additions = []
    headings = ['Thông số kỹ thuật', 'Chất liệu', 'Kích thước', 'Công dụng', 'Cam kết chất lượng']
    for number, start in enumerate(starts):
        block = paragraphs[start:starts[number + 1] if number + 1 < len(starts) else len(paragraphs)]
        name, description = block[2:4]
        sections = {}
        for i, heading in enumerate(headings):
            end = block.index(headings[i + 1]) if i + 1 < len(headings) else len(block)
            sections[heading] = block[block.index(heading) + 1:end]
        image = SOURCE / 'THIẾT BỊ - SẢN PHẨM' / IMAGES[number]
        assert image.is_file(), image
        additions.append(dict(
            name=name, image=image.relative_to(ROOT).as_posix(), alt=name + ' cho sự kiện',
            price='Liên hệ', short=description, description=description,
            specs=sections['Thông số kỹ thuật'], material=' '.join(sections['Chất liệu']),
            size=' '.join(sections['Kích thước']), uses=sections['Công dụng'],
            commitments=sections['Cam kết chất lượng'],
        ))
    page = ROOT / 'index.html'
    html = page.read_text(encoding='utf-8')
    marker = '\n    ];\n\n    const rentalGrid'
    assert marker in html
    assert additions[0]['image'] not in html, 'Update already imported'
    html = html.replace(marker, ',\n' + ',\n'.join(
        '      ' + json.dumps(p, ensure_ascii=False, separators=(',', ':')) for p in additions
    ) + marker, 1)
    html = html.replace(
        'const rentalOrder = [0, 6, 7, 3, 1, 4, 5, 8, 2, 9, 10, 11, 12];',
        'const rentalOrder = [0, 6, 7, 3, 1, 4, 5, 8, 2, ...products.slice(9).map((_, i) => i + 9)];',
    )
    html = html.replace('${list(sharedCommitments)}', '${list(p.commitments || sharedCommitments)}')
    page.write_text(html, encoding='utf-8')
    print(f'Imported {len(additions)} products using original PNG images.')


if __name__ == '__main__':
    main()
