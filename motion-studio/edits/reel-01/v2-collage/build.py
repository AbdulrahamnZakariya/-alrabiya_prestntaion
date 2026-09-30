import json, re, os
P = "/tmp/claude-0/-home-user--alrabiya-prestntaion/86361e0e-fe06-547a-bf25-0b60d960019a/scratchpad/edit/hf/v2"
W = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(W, "index.tpl.html"), encoding="utf-8").read()
icons = {}
for n in ["frown","bot","scissors","eye","lightbulb","palette","pen-tool","sparkles","trending-up","handshake","check","x","cpu","layers","wand-sparkles","message-circle","play","film","user","award","sliders-horizontal"]:
    s = open(f"{P}/assets/icons/ui/{n}.svg", encoding="utf-8").read()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"^.*?<svg[^>]*>", "", s, flags=re.S).replace("</svg>", "")
    icons[n] = " ".join(s.split())
brands = {}
for n in ["adobepremierepro","adobeaftereffects","claude","openai","davinciresolve","youtube","googlegemini"]:
    s = open(f"{P}/assets/icons/brands/{n}.svg", encoding="utf-8").read()
    s = re.sub(r"<title>.*?</title>", "", s)
    s = re.sub(r"^.*?<svg[^>]*>", "", s, flags=re.S).replace("</svg>", "")
    brands[n] = " ".join(s.split())
caps = json.load(open(f"{P}/caps.json", encoding="utf-8"))
words = [[w["w"], round(w["s"], 3), round(w["e"], 3), w["sent"]] for w in caps["words"]]
out = tpl.replace("/*ICONS*/{}", json.dumps(icons, ensure_ascii=False)) \
         .replace("/*BRANDS*/{}", json.dumps(brands, ensure_ascii=False)) \
         .replace("/*WORDS*/[]", json.dumps(words, ensure_ascii=False))
open(f"{P}/index.html", "w", encoding="utf-8").write(out)
print("ok", len(out))
