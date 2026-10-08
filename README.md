# bg remover 🪄

drops the background from any image, works right in the browser. no server, no api key, nothing to install.

i built this to see if you can actually run ai in the browser without a backend. turns out you can lol

---

## what it does

- drop an image or pick one from your files
- ai cuts out the background
- you see the original and result side by side
- download it as a png

## how to run it

cant just open the html file directly, you need a local server. easiest way:

```bash
npx serve .
```

open `http://localhost:3000` and thats it

## stuff used

- html css js, thats it. no react no nothing
- [@imgly/background-removal](https://github.com/imgly/background-removal-js) for the ai part
- first time you click remove it downloads the model which is like 40mb so give it a minute, after that its cached

---

made this for fun, learned a lot about webassembly and how browsers can do way more than i thought
