"""Import ONLY presentation CSS and the data-free menu template from a private source.
Never import dashboards: they can contain embedded operational records.
Usage: python tools/import_portal_presentation.py --portal-source PATH
"""
from pathlib import Path
import argparse
import re

parser = argparse.ArgumentParser()
parser.add_argument('--portal-source', type=Path, required=True)
source = parser.parse_args().portal_source
root = Path(__file__).resolve().parents[1]
template = (source / 'server/templates/menu.html').read_text(encoding='utf-8')
theme = (source / 'server/templates/_theme.css').read_text(encoding='utf-8')
styles = re.search(r'<style>(.*?)</style>', template, re.S).group(1).replace('{{THEME_CSS}}', theme)
(root / 'docs/assets/portal.css').write_text(styles, encoding='utf-8')
notice = '<div class="public-demo-notice menu-notice"><strong>DEMONSTRAÇÃO PÚBLICA</strong><span>Esta é uma demonstração de uma solução desenvolvida para a Orsegups. Todos os dados são fictícios.</span></div>'
template = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="assets/portal.css"><link rel="stylesheet" href="assets/demo.css">', template, flags=re.S)
template = template.replace('{{THEME_JS}}', (source / 'server/templates/_theme.js').read_text(encoding='utf-8'))
template = template.replace('{{NAME}}', 'Visitante Demo').replace('{{ADMIN_LINK}}', '<a class="hbtn" href="admin.html">Admin · Demo</a>').replace('{{ICON_LOGOUT}}', '').replace('{{ROTAS_STATUS}}','')
template = template.replace('href="/logout">Sair', 'href="https://github.com/JvFaraco/operational-dashboard-platform" target="_blank" rel="noopener noreferrer">Código')
for old, new in [('/produtividade','produtividade.html'),('/rotas','rotas.html'),('/os','os.html')]:
    template = template.replace(f'href="{old}"', f'href="{new}"')
template = template.replace('href="/"','href="index.html"').replace('<main>', '<main id="main">'+notice)
template = template.replace('Central A365 disponível','Ambiente demonstrativo').replace('Acesso protegido','Dados fictícios').replace('Dados integrados','Navegação livre')
template = template.replace('<title>Portal A365</title>','<title>Portal A365 — Demo pública Orsegups</title>')
template = template.replace('</head>', '<meta name="description" content="Demonstração pública da solução Portal A365 desenvolvida para a Orsegups, com dados fictícios."></head>')
template = template.replace('</body>', '<script src="assets/public-boundary.js"></script></body>')
template = template.replace('href="assets/demo.css"', 'href="assets/public-boundary.css"')
template = template.replace('<body>', '<body data-page="home"><a class="skip-link" href="#main">Pular para o conteúdo</a>')
assert '{{' not in template
(root / 'docs/index.html').write_text(template, encoding='utf-8')
