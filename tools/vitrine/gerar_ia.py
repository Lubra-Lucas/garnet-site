"""Gera variações de foto de um produto REAL com o Gemini, a partir de uma foto de referência.

Uso:
  python3 tools/vitrine/gerar_ia.py --ref "/caminho/foto.png" --variacao angulo --qtd 2 --nome bocarosa-omg
  python3 tools/vitrine/gerar_ia.py --listar-modelos

Variações prontas: angulo, aberto, caixa, frontal, detalhe (ou --pedido "texto livre").
As imagens vão para revisao/ (fora do site) com um revisao/lista.json, para aprovação humana.
Requer a variável de ambiente GEMINI_API_KEY. Só usa a biblioteca padrão do Python.
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.request, urllib.error

API = "https://generativelanguage.googleapis.com/v1beta"
MODELO_PADRAO = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")

# Regras que vão em todo pedido: o produto não pode mudar (é um produto real que a Garnet fabricou).
BASE = (
    "Use the attached photo as the exact product reference. The product must stay IDENTICAL: "
    "same packaging shape and proportions, same logos and printed text (do not add, remove or rewrite any text), "
    "same colors and the same shades in every pan. Professional studio product photography, soft diffused light "
    "from above, plain warm off-white seamless background (#F7F4EF), subtle soft shadow under the product, "
    "vertical 4:5 composition, product centered and fully visible, no props, no hands, no extra products, no watermark. "
)
VARIACOES = {
    "angulo": "Show the same product from a different camera angle (three-quarter view from the left).",
    "aberto": "Show the same product with the lid open, pans clearly visible.",
    "caixa": "Show the same product next to its own box, as in the reference.",
    "frontal": "Show the same product in a straight frontal view, slightly from above.",
    "detalhe": "Show a close-up of the pressed powder/pans of the same product, texture and embossing visible.",
}


def chamar(caminho, corpo=None):
    chave = os.environ.get("GEMINI_API_KEY")
    if not chave:
        sys.exit("GEMINI_API_KEY não está definida nesta sessão (abra uma sessão nova depois de configurar).")
    req = urllib.request.Request(f"{API}/{caminho}", data=json.dumps(corpo).encode() if corpo else None,
                                 headers={"x-goog-api-key": chave, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Erro da API ({e.code}): {e.read().decode()[:500]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", help="foto real de referência")
    ap.add_argument("--nome", help="nome base do arquivo (ex.: bocarosa-omg)")
    ap.add_argument("--variacao", default="angulo", choices=sorted(VARIACOES))
    ap.add_argument("--pedido", help="pedido livre (substitui a variação pronta)")
    ap.add_argument("--qtd", type=int, default=1)
    ap.add_argument("--modelo", default=MODELO_PADRAO)
    ap.add_argument("--saida", default="revisao")
    ap.add_argument("--listar-modelos", action="store_true")
    a = ap.parse_args()

    if a.listar_modelos:
        ms = chamar("models?pageSize=200").get("models", [])
        for m in ms:
            if "image" in m["name"]:
                print(m["name"], "-", m.get("displayName", ""))
        return
    if not a.ref or not a.nome:
        ap.error("--ref e --nome são obrigatórios")

    os.makedirs(a.saida, exist_ok=True)
    mime = mimetypes.guess_type(a.ref)[0] or "image/png"
    foto = base64.b64encode(open(a.ref, "rb").read()).decode()
    pedido = BASE + (a.pedido or VARIACOES[a.variacao])
    lista_p = os.path.join(a.saida, "lista.json")
    lista = json.load(open(lista_p)) if os.path.exists(lista_p) else []

    for i in range(a.qtd):
        corpo = {"contents": [{"parts": [{"inline_data": {"mime_type": mime, "data": foto}}, {"text": pedido}]}],
                 "generationConfig": {"responseModalities": ["IMAGE"]}}
        r = chamar(f"models/{a.modelo}:generateContent", corpo)
        partes = r.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        img = next((p.get("inlineData") or p.get("inline_data") for p in partes if p.get("inlineData") or p.get("inline_data")), None)
        if not img:
            print("Sem imagem na resposta:", json.dumps(r)[:400]); continue
        ext = ".png" if "png" in img.get("mimeType", img.get("mime_type", "")) else ".jpg"
        arq = os.path.join(a.saida, f"{a.nome}-{a.pedido and 'livre' or a.variacao}-{int(time.time())}-{i + 1}{ext}")
        open(arq, "wb").write(base64.b64decode(img["data"]))
        lista.append({"arquivo": arq, "ref": a.ref, "nome": a.nome, "pedido": a.pedido or a.variacao, "status": "pendente"})
        print("salva:", arq)
    json.dump(lista, open(lista_p, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
