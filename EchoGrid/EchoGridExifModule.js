// EchoGridModule.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function EchoGridModule() {
    const [images, setImages] = useState([]);
    const [fragments, setFragments] = useState([]);
    const [payload, setPayload] = useState('');
    const [timestamp, setTimestamp] = useState('');

    useEffect(() => {
        const allImgs = Array.from(document.querySelectorAll('img'));
        const ghostImgs = allImgs.filter(img =>
            img.src.includes('ghost_') ||
            (img.alt && img.alt.includes('ghost'))
        );

        const fetchExifData = async (img) => {
            try {
                const response = await fetch(img.src);
                const arrayBuffer = await response.arrayBuffer();
                const view = new DataView(arrayBuffer);
                let exif = '';
                for (let i = 0; i < view.byteLength - 1; i++) {
                    if (view.getUint8(i) === 0x45 && view.getUint8(i + 1) === 0x78) {
                        exif = new TextDecoder().decode(new Uint8Array(arrayBuffer.slice(i)));
                        break;
                    }
                }
                const match = exif.match(/"index":(\d+),"data":"([a-zA-Z0-9+/=]+)"/);
                if (match) {
                    return { index: parseInt(match[1]), data: match[2] };
                }
            } catch (e) {
                console.error("EXIF parsing error", e);
            }
            return null;
        };

        const loadFragments = async () => {
            const results = await Promise.all(ghostImgs.map(async img => {
                const match = img.src.match(/ghost_(\d+)_([a-zA-Z0-9+/]+)\.jpg/);
                if (match) {
                    return { index: parseInt(match[1]), data: match[2] };
                }
                try {
                    const alt = JSON.parse(img.alt);
                    return { index: alt.index, data: alt.data };
                } catch (e) {
                    const exifData = await fetchExifData(img);
                    return exifData;
                }
            }));

            const validFragments = results.filter(Boolean);
            setImages(ghostImgs);
            setFragments(validFragments);
        };

        loadFragments();
    }, []);

    const assemblePayload = async () => {
        try {
            const res = await axios.post('http://localhost:7777/assemble', {
                fragments,
                strategy: 'timestampMutator',
                timestamp: timestamp || new Date().toISOString()
            });
            setPayload(res.data.payload);
        } catch (err) {
            setPayload(`Error: ${err.message}`);
        }
    };

    return (
        <div className="p-4 bg-black text-green-400 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-2">🧿 EchoGrid GhostShell Interface</h2>
            <p className="text-sm mb-2">Found {fragments.length} fragments embedded in thumbnails.</p>
            <input
                type="text"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                placeholder="Optional ISO Timestamp"
                className="w-full mb-2 p-2 bg-gray-800 border border-green-500 rounded"
            />
            <button
                onClick={assemblePayload}
                className="bg-green-700 px-4 py-2 rounded hover:bg-green-600"
            >
                Decode Payload
            </button>
            {payload && (
                <pre className="mt-4 bg-gray-900 p-4 rounded text-xs overflow-auto max-h-64">
                    {payload}
                </pre>
            )}
        </div>
    );
}
