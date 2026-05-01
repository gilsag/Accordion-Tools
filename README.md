# Accordion-Tools

Accordion-Tools is a web project built with [Vite](https://vite.dev/) and npm.

This project is intended to provide tools, resources, or interactive features related to accordion learning, practice, or reference.

## Live Site

Once deployed with GitHub Pages, the site will be available at:

```text
https://gilsag.github.io/Accordion-Tools/
```

## Project Structure

A typical structure for this project is:

```text
Accordion-Tools/
├── public/
├── src/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── LICENSE
```

## Requirements

To run this project locally, you need:

- Node.js
- npm

You can check whether they are installed by running:

```bash
node --version
npm --version
```

## Running the Project Locally

First, install the project dependencies:

```bash
npm install
```

Then start the development server:

```bash
npm run dev
```

Vite will show a local address in the terminal, usually something like:

```text
http://localhost:5173/
```

Open that address in your browser to view the project.

## Building the Project

To create the production version of the site, run:

```bash
npm run build
```

This creates a `dist` folder, which contains the files that can be published online.

## Deploying to GitHub Pages

This project is intended to be deployed using GitHub Pages.

For GitHub Pages, make sure `vite.config.js` includes the correct base path:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Accordion-Tools/',
})
```

If the project uses React or another plugin, keep the plugin settings and add the `base` value inside the same configuration object.

Example with React:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Accordion-Tools/',
})
```

The project can be deployed automatically with GitHub Actions using a workflow file located at:

```text
.github/workflows/deploy.yml
```

In the GitHub repository settings, go to:

```text
Settings → Pages → Build and deployment
```

Then set the source to:

```text
GitHub Actions
```

## Files Not to Upload

Do not upload the following folder:

```text
node_modules/
```

This folder is large and can be recreated automatically using:

```bash
npm install
```

Also avoid uploading private files such as:

```text
.env
```

These may contain passwords, tokens, or private settings.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

You may copy, fork, modify, and reuse this project for personal, educational, and other non-commercial purposes, as long as appropriate credit is given.

Commercial use is not permitted without prior written permission.

See the `LICENSE` file for more details.

## Author

Created by Esteban Gil (gilsag)
