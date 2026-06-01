import os
import re
import json
import datetime
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
app = Flask(__name__)
app.secret_key = os.environ.get("A365_SECRET_KEY", "a365_secret_key_dev")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB
# ── Configuracao ─────────────────────────────────────────────────────────────
USERS = [""]
MASTER_PASS = os.environ.get("A365_MASTER_PASS", "")

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

TIPOS = {
    "bios":          "Controle de Agenda",
    "agendadas":     "Agendadas",
    "nao_agendadas": "Não agendadas",
}

def path_xlsx(tipo): return os.path.join(DATA_DIR, f"{tipo}.xlsx")
def path_meta(tipo): return os.path.join(DATA_DIR, f"meta_{tipo}.json")
HIST_PATH = os.path.join(DATA_DIR, "historico_uploads.json")

# ── Cache em memoria: rele do disco apenas quando o arquivo muda ─────────────
_cache = {}

def load_xlsx(tipo):
    p = path_xlsx(tipo)

    if not os.path.exists(p):
        return []

    mtime = os.path.getmtime(p)

    if _cache.get(tipo, {}).get("mtime") != mtime:

        df = pd.read_excel(p)

        # converter datas para pt-BR
        for col in df.columns:

            if col in [
                "Abertura",
                "Agenda",
                "Agendamento",
                "Execução",
                "Fechamento"
            ]:

                try:

                    df[col] = pd.to_datetime(
                        df[col],
                        errors="coerce"
                    ).dt.strftime("%d/%m")

                except:
                    pass

        df = df.astype(object).replace([np.inf, -np.inf], "")

        df = df.where(pd.notnull(df), "")
        _cache[tipo] = {
            "mtime": mtime,
            "data": df.to_dict(orient="records")
        }

    return _cache[tipo]["data"]

def load_meta(tipo):
    p = path_meta(tipo)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

# ── Paginas ──────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        user = request.form.get("user")
        password = request.form.get("password")
        if user in USERS and password == MASTER_PASS:
            session["logged_in"] = True
            session["user"] = user
            return redirect(url_for("upload"))
        error = "Usuário ou senha inválidos"
    return render_template("login.html", error=error)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/upload", methods=["GET", "POST"])
def upload():
    if not session.get("logged_in"):
        return redirect(url_for("login"))

    if request.method == "POST":
        file = request.files.get("arquivo")
        tipo_base = request.form.get("tipo_base")

        if not file:
            return jsonify({"ok": False, "erro": "Nenhum arquivo enviado"}), 400
        if tipo_base not in TIPOS:
            return jsonify({"ok": False, "erro": "Tipo de base inválido"}), 400

        try:
            caminho = path_xlsx(tipo_base)
            file.save(caminho)
            df = pd.read_excel(caminho)
            registros = len(df)

            # invalida cache desta base para o proximo /api/<tipo>
            _cache.pop(tipo_base, None)

            # meta por tipo
            meta = {
                "arquivo": file.filename,
                "registros": registros,
                "usuario": session.get("user"),
                "tipo": tipo_base,
                "tipo_label": TIPOS[tipo_base],
                "atualizado_em": datetime.datetime.now().strftime("%d/%m/%Y %H:%M"),
            }
            with open(path_meta(tipo_base), "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)

            # historico global
            historico = []
            if os.path.exists(HIST_PATH):
                with open(HIST_PATH, "r", encoding="utf-8") as f:
                    historico = json.load(f)
            historico.insert(0, meta)
            with open(HIST_PATH, "w", encoding="utf-8") as f:
                json.dump(historico, f, ensure_ascii=False, indent=2)

            return jsonify({
                "ok": True,
                "registros": registros,
                "tipo": tipo_base,
                "meta": meta
            })
        except Exception as e:
            return jsonify({"ok": False, "erro": str(e)}), 500

    return render_template("upload.html")

# ── Paginas dos BIs ──────────────────────────────────────────────────────────
@app.route("/controle-os")
def controle_os():
    return render_template("controle_os.html")

@app.route("/agendadas")
def agendadas():
    return render_template("agendadas.html")

@app.route("/nao-agendadas")
def nao_agendadas():
    return render_template("nao_agendadas.html")

# ── APIs de dados ────────────────────────────────────────────────────────────
@app.route("/api/controle-os")
def api_controle_os():
    return jsonify(load_xlsx("bios"))

@app.route("/api/agendadas")
def api_agendadas():
    return jsonify(load_xlsx("agendadas"))

@app.route("/api/nao-agendadas")
def api_nao_agendadas():
    return jsonify(load_xlsx("nao_agendadas"))

# ── APIs de meta ─────────────────────────────────────────────────────────────
@app.route("/api/meta")
def api_meta_all():
    """Retorna meta das 3 bases (usado pela pagina /upload)."""
    return jsonify({t: load_meta(t) for t in TIPOS})

@app.route("/api/meta/<tipo>")
def api_meta_tipo(tipo):
    if tipo not in TIPOS:
        return jsonify({"erro": "Tipo inválido"}), 404
    return jsonify(load_meta(tipo) or {})

# Aliases convenientes para os BIs lerem direto pelo nome da pagina
@app.route("/api/meta/controle-os")
def api_meta_controle():
    return jsonify(load_meta("bios") or {})

@app.route("/api/meta/nao-agendadas")
def api_meta_nao():
    return jsonify(load_meta("nao_agendadas") or {})

# ── RECRED ───────────────────────────────────────────────────────────────────
@app.route("/recred")
def recred():
    return render_template("recred.html")

@app.route("/api/recred")
def api_recred():
    data = load_xlsx("bios")
    today = datetime.datetime.today()
    result = []
    for r in data:
        defeito = str(r.get("Defeito", "") or "")
        if "Inadimplência" not in defeito:
            continue
        desc = str(r.get("Descrição", "") or "")
        # Extrair multa contratual
        multa = None
        idx = desc.find("R$")
        if idx != -1:
            rest = desc[idx + 2:].lstrip("\xa0 ")
            m = re.match(r"([\d.]+,\d{2})", rest)
            if m:
                try:
                    multa = float(m.group(1).replace(".", "").replace(",", "."))
                except Exception:
                    pass
        # Extrair dias suspenso
        dias_suspenso = None
        m2 = re.search(r"suspenso desde (\d{2}/\d{2}/\d{4})", desc)
        if m2:
            try:
                dt = datetime.datetime.strptime(m2.group(1), "%d/%m/%Y")
                dias_suspenso = (today - dt).days
            except Exception:
                pass
        r["Multa"] = multa
        r["Dias Suspenso"] = dias_suspenso
        result.append(r)
    return jsonify(result)
# ── Mapa de Cobertura ───────────────────────────────────────────────────────
MAPA_COBERTURA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'mapa_rotas_a365.json')

@app.route('/mapa-cobertura')
def mapa_cobertura():
    return render_template('mapa_cobertura.html')

@app.route('/api/mapa-cobertura')
def api_mapa_cobertura():
    try:
        with open(MAPA_COBERTURA_PATH, encoding='utf-8') as f:
            dados = json.load(f)
        return jsonify(dados)
    except FileNotFoundError:
        return jsonify([])


@app.route('/api/filiais-orsegups')
def api_filiais_orsegups():
    try:
        caminho = os.path.join(os.path.dirname(__file__), 'data', 'filiais_orsegups.json')
        with open(caminho, encoding='utf-8') as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])

# ── Erros ────────────────────────────────────────────────────────────────────
@app.errorhandler(413)
def too_large(e):
    return jsonify({"ok": False, "erro": "Arquivo excede o limite de 50 MB"}), 413

if __name__ == '__main__':

    from waitress import serve
    import socket

    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print()
    print("=" * 50)
    print("A365 Ops iniciado!")
    print(f"Local:  http://localhost:5000")
    print(f"Rede:   http://{local_ip}:5000")
    print(f"DNS:    http://a365ops:5000")
    print("=" * 50)
    print()

    serve(app, host='0.0.0.0', port=5000)
