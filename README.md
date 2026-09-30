# Taihe Technology corporate website

An independent static company website project. It is separate from the existing MS01 point-cloud viewer.

## Local development

Requirements: Node.js 20 or later and Python 3.

```sh
npm test
npm run dev
```

Open `http://localhost:8766/` in a browser. The included local server serves this directory only, binds to localhost by default, and labels JavaScript modules correctly; it does not upload selected files. To choose another port, run `python scripts/serve.py --port 8000`.

Product specifications are centralized in `assets/js/product-specs.js` and checked against the supplied TH-S02 product manual by the Node test suite.

## Publishing

Publish this project to its own GitHub Pages repository, separate from the existing MS01 point-cloud viewer. Serve the repository root from the default branch. The TH-S02 manual is not bundled or offered for download; only the two diagrams included in `assets/images/` are published. Contact details are intentionally omitted until the company supplies approved information.

