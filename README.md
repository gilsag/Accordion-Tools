# Accordion-Tools

Accordion-Tools is a web project built with [Vite](https://vite.dev/) and npm.

The project is designed as a collection of tools, references, and learning aids for accordion players, students, teachers, and enthusiasts.

## Live Site

Once deployed with GitHub Pages, the site will be available at:

```text
https://gilsag.github.io/Accordion-Tools/
```

## About the Project

Accordion-Tools is intended to make accordion practice and reference easier by bringing useful resources together in one simple web app.

Depending on the version of the project, the site may include tools for exploring notes, chords, scales, layouts, practice patterns, or other accordion-related information.

The goal is to create a practical, accessible, and easy-to-use resource for people learning or working with the accordion.

## Features

Below is a detailed description of the different kinds of functionality that may be included in Accordion-Tools.

You can edit this section later to match the exact tools included in your current version of the project.

### Accordion Reference Tools

The project may include reference tools that help users quickly look up accordion-related information.

These tools can be useful for:

- Finding notes, chords, or musical patterns
- Reviewing musical concepts
- Supporting daily practice
- Helping students understand accordion layouts
- Giving teachers a simple visual reference during lessons

### Chord and Harmony Support

Accordion-Tools may include features related to chords and harmony.

Possible uses include:

- Looking up common chords
- Comparing different chord types
- Understanding how chords are built
- Supporting accompaniment practice
- Helping users connect theory with practical accordion playing

This section is especially useful for players who want to improve their left-hand accompaniment, chord recognition, or general harmonic understanding.

### Scale and Practice Support

The project may provide tools for working with scales, exercises, or practice patterns.

This can help users:

- Practice scales more consistently
- Review musical patterns
- Develop finger familiarity
- Study note relationships
- Build confidence through repetition

These tools are meant to support regular practice, not replace a teacher or a complete method book.

### Learning and Teaching Aid

Accordion-Tools can be used as a learning aid by students and as a teaching aid by instructors.

For students, it can provide a quick way to review material outside of lessons.

For teachers, it can be used to demonstrate concepts visually, assign practice ideas, or explain musical structures in a clear way.

### Interactive Web Interface

Because this project is built as a web app, users can access it through a browser without installing special software.

The interface is intended to be simple and direct, so users can focus on the musical information rather than on complicated menus or setup.

### Open for Non-Commercial Reuse

Others may copy, fork, modify, and reuse this project for personal, educational, and other non-commercial purposes, as long as appropriate credit is given.

Commercial use is not permitted without prior written permission. See the `LICENSE` file for details.

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

Created by Esteban Gil (gilsag).
