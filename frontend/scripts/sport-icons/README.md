# 3D-иконки направлений

Иконки в `public/sport-icons/*.webp`: часть взята из файла «Sports 3D Icon Pack (Community)» в Figma
(футбол, баскетбол, теннис, настольный теннис, бадминтон, хоккей, плавание, шахматы, бокс и трофей вместо медали),
остальные рендерятся процедурными 3D-моделями (three.js, PBR-освещение студии).
Модели собираются из примитивов в `render.js`: мячи — сфера с канавками швов и цветом панелей по вершинам,
остальное — выдавленные контуры со скруглением, трубки и тела вращения.
Перегенерация `render.js` перезапишет и иконки из Figma, поэтому для них берите исходный PNG из Figma, а не рендер.

Перегенерировать:

```bash
cd frontend
npm i --no-save three@0.169.0
npm run dev
# открыть http://localhost:5173/scripts/sport-icons/render.html — превью всех иконок;
# window.__icons содержит data URL каждой картинки (slug → image/webp), их сохраняют в public/sport-icons/
```

Новое направление: добавьте модель в `MODELS` в `render.js`, сохраните картинку как `public/sport-icons/<slug>.webp`
и добавьте slug в `ICONS` в `src/components/SportIllustration.tsx`.
