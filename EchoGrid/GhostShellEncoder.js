// ghost-fragment-encoder/index.js
const express = require('express');
const bodyParser = require('body-parser');
const btoa = require('btoa');
const atob = require('atob');
const exif = require('exiftool-vendored').exiftool;
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

function slicePayload(payload, parts = 5) {
    const length = Math.ceil(payload.length / parts);
    const fragments = [];
    for (let i = 0; i < parts; i++) {
        const chunk = payload.slice(i * length, (i + 1) * length);
        fragments.push(chunk);
    }
    return fragments;
}

function encodeUnicodeStego(str) {
    return str.split('').map(c => c + '\u200b').join('');
}

function generateCarrierFields(fragment, index, strategy = "filename") {
    switch (strategy) {
        case "filename":
            return `ghost_${index}_${btoa(fragment).replace(/=+$/, '')}.jpg`;
        case "altText":
            return `{"index":${index},"data":"${btoa(fragment)}"}`;
        case "username":
            return `G${index}_${fragment.slice(0, 6)}`;
        case "unicodeStego":
            return encodeUnicodeStego(fragment);
        case "timestampMutator":
            return mutateFragment(fragment);
        default:
            return fragment;
    }
}

function generateTreasureMap(primaryIndex, allFragments) {
    const coordHint = {
        targetIndex: primaryIndex + 1,
        method: "altText",
        clue: `Seek the shard bearing mark ${primaryIndex + 1}`
    };
    return btoa(JSON.stringify(coordHint));
}

function mutateFragment(fragment, dateOverride = null) {
    const now = dateOverride || new Date();
    const seed = `${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
    const encoded = fragment.split('').map((char, i) => {
        const charCode = char.charCodeAt(0);
        const shift = parseInt(seed[i % seed.length]) || 1;
        return String.fromCharCode(charCode ^ shift);
    }).join('');
    return btoa(encoded);
}

function reverseMutate(encoded, dateOverride = null) {
    const now = dateOverride || new Date();
    const seed = `${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}`;
    const input = atob(encoded);
    return input.split('').map((char, i) => {
        const charCode = char.charCodeAt(0);
        const shift = parseInt(seed[i % seed.length]) || 1;
        return String.fromCharCode(charCode ^ shift);
    }).join('');
}

app.post('/encode', (req, res) => {
    const { payload, parts, strategy } = req.body;
    if (!payload) return res.status(400).json({ error: 'Payload required' });

    const fragments = slicePayload(payload, parts || 5);
    const encoded = fragments.map((frag, idx) => {
        const container = generateCarrierFields(frag, idx, strategy || 'filename');
        const clue = (idx === 0) ? generateTreasureMap(idx, fragments) : null;
        return {
            index: idx,
            encoded: container,
            embeddedClue: clue
        };
    });

    res.json({ fragments: encoded });
});

app.post('/assemble', (req, res) => {
    const { fragments, strategy, timestamp } = req.body;
    if (!fragments || !Array.isArray(fragments)) {
        return res.status(400).json({ error: 'Fragments array required' });
    }

    try {
        fragments.sort((a, b) => a.index - b.index);
        const date = timestamp ? new Date(timestamp) : new Date();
        const decoded = fragments.map(f => {
            if (strategy === 'timestampMutator') {
                return reverseMutate(f.data, date);
            }
            return atob(f.data);
        }).join('');
        res.json({ payload: decoded });
    } catch (e) {
        res.status(500).json({ error: 'Failed to assemble payload', detail: e.message });
    }
});

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`🧠 Ghost Fragment Encoder API running on port ${PORT}`);
});