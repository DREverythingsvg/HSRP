/**
 * HSRP & FHRP Exam Master - Core Application Logic
 * Includes:
 * - Randomized quiz engine (both questions & choices randomized automatically)
 * - Interactive Cisco CLI command trainer & flashcards
 * - Full device configuration editor & syntax validator (ISP, MLS1, MLS2)
 * - Interactive Network Topologies with clickable node inspector
 * - Web Audio API sound effects
 */

// ==========================================
// 1. SOUND EFFECTS (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      // Audio might fail if user hasn't interacted yet
    }
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.12, 0);     // C5
    this.playTone(659.25, 'sine', 0.12, 0.08);  // E5
    this.playTone(783.99, 'sine', 0.22, 0.16);  // G5
  }

  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0);
    this.playTone(220, 'sawtooth', 0.28, 0.12);
  }

  playClick() {
    this.playTone(400, 'triangle', 0.05, 0);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.2, idx * 0.1);
    });
  }
}

const sfx = new SoundFX();

// ==========================================
// 2. QUIZ QUESTION DATABASE (Based 100% on PDF)
// ==========================================
const MASTER_QUESTIONS = [
  {
    id: 1,
    category: "fhrp-intro",
    importance: "★ VIKTIGAST TILL PROV",
    question: "Vad står förkortningen FHRP för och vad är dess primära syfte?",
    options: [
      "First Hop Redundancy Protocols – erbjuder redundans för default gateway så klienter inte tappar internet om en router kraschar.",
      "Fast Host Routing Protocol – ökar överföringshastigheten mellan switchar och routrar på Layer 2.",
      "Forwarding Hop Redundant Path – används för dynamisk routing på internet likt BGP.",
      "Fixed Hardware Redundancy Protocol – reservströmförsörjning i Cisco-switchar."
    ],
    correctIndex: 0,
    explanation: "FHRP står för First Hop Redundancy Protocols. Dess roll är att skapa en virtuell default gateway med redundans så klienter alltid har kontakt med omvärlden även om den primära routern slutar fungera.",
    ref: "PDF Sida 1: 'Tre vanliga FHRP-protokoll / FHRP - First Hop Redundancy Protocols'"
  },
  {
    id: 2,
    category: "fhrp-intro",
    importance: "★ DETTA KOMMER PÅ PROV",
    question: "Vilket av följande påståenden stämmer angående standarder och protokolltyp för HSRP, VRRP och GLBP?",
    options: [
      "HSRP och GLBP är Cisco-proprietära protokoll, medan VRRP är en öppen standard.",
      "VRRP och GLBP är öppna standarder, medan HSRP är Cisco-proprietärt.",
      "Alla tre (HSRP, VRRP och GLBP) är helt öppna IEEE/IETF-standarder.",
      "HSRP är en öppen standard, medan VRRP och GLBP endast fungerar på Cisco-hårdvara."
    ],
    correctIndex: 0,
    explanation: "HSRP och GLBP utvecklades av Cisco och är Cisco-specifika protokoll. VRRP (Virtual Router Redundancy Protocol) är den öppna standarden som definierats av IETF.",
    ref: "PDF Sida 1: 'HSRP - Cisco-protokoll', 'VRRP - Öppen standard', 'GLBP - Cisco-protokoll'"
  },
  {
    id: 3,
    category: "fhrp-intro",
    importance: "★ DETTA KOMMER PÅ PROV (ROLLER & LASTDELNING)",
    question: "Vilka roller och vilken lastdelning gäller för HSRP?",
    options: [
      "Roller: Active och Standby. Lastdelning: Endast en aktiv router per grupp.",
      "Roller: Active/Master och Backup. Lastdelning: Flera routrar kan vidarebefordra samtidigt.",
      "Roller: AVG och AVF. Lastdelning: Flera routrar via round-robin.",
      "Roller: Master och Slave. Lastdelning: Dynamisk per paket."
    ],
    correctIndex: 0,
    explanation: "I HSRP heter rollerna Active och Standby. Endast den Active routern vidarebefordrar trafik för gruppen (en router per grupp).",
    ref: "PDF Sida 1: 'HSRP - Cisco-protokoll Roller: active och standby Lastdelning: en router per grupp'"
  },
  {
    id: 4,
    category: "vrrp-glbp",
    importance: "★ DETTA KOMMER PÅ PROV (ROLLER & LASTDELNING)",
    question: "Vilka roller har VRRP och hur fungerar dess lastdelning?",
    options: [
      "Roller: Active/Master och Backup. Lastdelning: En router per grupp.",
      "Roller: Active och Standby. Lastdelning: Två aktiva routrar per subnät.",
      "Roller: AVG och AVF. Lastdelning: Flera routrar per grupp.",
      "Roller: Primary och Secondary. Lastdelning: Obalanserad per port."
    ],
    correctIndex: 0,
    explanation: "VRRP har rollerna Active/Master och Backup. Precis som HSRP är det en router per grupp som hanterar trafiken.",
    ref: "PDF Sida 1: 'VRRP - Öppen standard Roller: active /master och Backup Lastdelning: en router per grupp'"
  },
  {
    id: 5,
    category: "vrrp-glbp",
    importance: "★ DETTA KOMMER PÅ PROV",
    question: "Vad är den stora fördelen med GLBP jämfört med HSRP och VRRP gällande lastdelning?",
    options: [
      "Flera routrar kan vidarebefordra trafik samtidigt i samma grupp (äkta lastdelning).",
      "GLBP kräver ingen konfiguration alls på routern utan startar med Plug & Play.",
      "GLBP är en öppen standard som stöds av alla tillverkare.",
      "GLBP använder ingen virtuell IP-adress."
    ],
    correctIndex: 0,
    explanation: "GLBP (Gateway Load Balancing Protocol) kombinerar redundans och lastdelning: flera routrar i samma grupp kan vidarebefordra data samtidigt!",
    ref: "PDF Sida 1 & 2: 'GLBP kombinerar redundans och lastdelning - flera routrar kan vidarebefordra'"
  },
  {
    id: 6,
    category: "vrrp-glbp",
    importance: "★ KOMMER I PROV",
    question: "Vad är den specifika uppgiften för en AVG (Active Virtual Gateway) i GLBP?",
    options: [
      "Den svarar på klienternas ARP-förfrågningar och delar ut olika virtuella MAC-adresser.",
      "Den stänger ner gränssnitt som överbelastas med switchport-blockering.",
      "Den krypterar all trafik mellan klienten och routern via IPsec.",
      "Den agerar enbart standby och vidarebefordrar aldrig några paket."
    ],
    correctIndex: 0,
    explanation: "Vad är rollen i AVG? Svar: Den svarar på klienternas ARP-förfrågningar! Därefter skickas trafiken till någon av AVF (Active Virtual Forwarders).",
    ref: "PDF Sida 2: 'Vad är rollen i AVG? Svar: Den svarar på klienternas ARP-förfrågningar'"
  },
  {
    id: 7,
    category: "vrrp-glbp",
    importance: "★ KOMMER I PROV",
    question: "Vilken standardmetod används av GLBP för att dela ut MAC-adresser till klienter?",
    options: [
      "Round-robin (MAC-adress delas ut i turordning)",
      "Host-dependent (varje klient binds permanent till IP)",
      "Weighted random (baserat på processorbelastning)",
      "First come first served utan återanvändning"
    ],
    correctIndex: 0,
    explanation: "Standardmetoden i GLBP är Round-robin: MAC-adress delas ut i turordning till klienternas ARP-förfrågningar.",
    ref: "PDF Sida 2: 'Round-robin: MAC-adress delas ut i turordning. Standardmetod'"
  },
  {
    id: 8,
    category: "hsrp-core",
    importance: "★ KOMMER PÅ PROV",
    question: "Vilken UDP-port används av HSRP för att kommunicera hello-meddelanden mellan routrarna?",
    options: [
      "UDP-port 1985",
      "UDP-port 53",
      "UDP-port 67",
      "UDP-port 520"
    ],
    correctIndex: 0,
    explanation: "HSRP skickar sina hello-paket över UDP på port 1985.",
    ref: "PDF Sida 1: 'UDP-port: 1985'"
  },
  {
    id: 9,
    category: "hsrp-core",
    importance: "★ KOMMER PÅ PROV (SUPERVIKTIG!)",
    question: "Vilken virtuell MAC-adress används för HSRP version 2 (HSRPv2) i grupp 1?",
    options: [
      "0000.0c9f.f001",
      "0000.0c07.ac01",
      "0000.5e00.0101",
      "0007.0c9f.ffff"
    ],
    correctIndex: 0,
    explanation: "I HSRPv2 har den virtuella MAC-adressen formatet 0000.0c9f.fXXX där de tre sista siffrorna anger gruppnumret i hexadecimal form. Grupp 1 har alltså: 0000.0c9f.f001! (HSRPv1 använde 0000.0c07.acXX).",
    ref: "PDF Sida 1: 'MAC-address: HSRPv2,grupp 1: 0000.0c9f.f001(KOMMER PÅ PROV)'"
  },
  {
    id: 10,
    category: "hsrp-core",
    importance: "★ GRUNDREGEL",
    question: "Vad är standardvärdet (default priority) för prioritet i HSRP?",
    options: [
      "100",
      "1",
      "50",
      "255"
    ],
    correctIndex: 0,
    explanation: "Standardvärdet för HSRP-prioritet är 100. Routern med högst prioritet har störst möjlighet att bli Active.",
    ref: "PDF Sida 1: 'Standardvärdet är 100 / Högsta prioritet innebär störst möjlighet att bli Active'"
  },
  {
    id: 11,
    category: "hsrp-core",
    importance: "★ PROVKOMMANDO",
    question: "Vilket kommando används för att sätta HSRP-prioritet för grupp 10 till 105 på ett gränssnitt?",
    options: [
      "standby 10 priority 105",
      "hsrp priority 105 group 10",
      "standby priority 105 vlan 10",
      "set standby 10 prio 105"
    ],
    correctIndex: 0,
    explanation: "Syntaxen i Cisco IOS är: standby <gruppnummer> priority <värde>. För grupp 10 och värde 105 blir det 'standby 10 priority 105'.",
    ref: "PDF Sida 1 & 5: 'standby <gruppnummer> priority <värde>' & 'MLS1: standby 10 priority 105'"
  },
  {
    id: 12,
    category: "hsrp-core",
    importance: "★ KOMMER PÅ PROV",
    question: "Vad gör kommandot 'standby <gruppnummer> preempt' i HSRP?",
    options: [
      "Preemption jämför prioritet och gör att en router med högre prioritet kan ta över rollen som Active från en befintlig Active router.",
      "Det tvingar routern att omedelbart gå ner i standby-läge.",
      "Det raderar HSRP-konfigurationen om routern startar om.",
      "Det förhindrar andra routrar från att kommunicera på samma VLAN."
    ],
    correctIndex: 0,
    explanation: "Preemption innebär att en router med högre prioritet inte bara nöjer sig med att vara standby om den startar om, utan den tar aktivt över rollen som Active. 'Preemption jämför prioritet'.",
    ref: "PDF Sida 1: 'standby <gruppnummer> preempt - Preemption jämför prioritet'"
  },
  {
    id: 13,
    category: "hsrp-states",
    importance: "★ 6 TILLSTÅND TILL PROV",
    question: "Vilka är HSRP:s 6 tillstånd i exakt rätt ordningsföljd?",
    options: [
      "Initial ➔ Learn ➔ Listen ➔ Speak ➔ Standby ➔ Active",
      "Initial ➔ Listen ➔ Learn ➔ Speak ➔ Active ➔ Standby",
      "Learn ➔ Listen ➔ Speak ➔ Hello ➔ Standby ➔ Active",
      "Disabled ➔ Init ➔ 2-Way ➔ ExStart ➔ Standby ➔ Active"
    ],
    correctIndex: 0,
    explanation: "HSRP går igenom sex tillstånd: 1. Initial, 2. Learn, 3. Listen, 4. Speak, 5. Standby, 6. Active.",
    ref: "PDF Sida 1: 'HSRP har 6 tillstånd: Initial, Learn, Listen, Speak, Standby, Active'"
  },
  {
    id: 14,
    category: "vrrp-glbp",
    importance: "★ DETTA KOMMER PÅ PROV",
    question: "Vilken standardprioritet har VRRP och vilken prioritet har adressägaren (IP address owner)?",
    options: [
      "Standardprioritet är 100, och adressägaren använder prioritet 255.",
      "Standardprioritet är 1, och adressägaren använder prioritet 100.",
      "Standardprioritet är 255, och adressägaren använder prioritet 0.",
      "VRRP har ingen prioritet utan lottar rollen."
    ],
    correctIndex: 0,
    explanation: "I VRRP är standardprioriteten 100. Om en router äger den faktiska IP-adressen som används virtuellt sätts dess prioritet automatiskt till maxvärdet 255.",
    ref: "PDF Sida 1: 'VRRP är en öppen standard / Standardprioriteten är 100 / Adressägaren använder prioritet 255'"
  },
  {
    id: 15,
    category: "topology-cli",
    importance: "★ GRUNDREGEL TOPOLOGI",
    question: "Vilken IP-adress konfigureras som default gateway på klienten (t.ex. PC0)?",
    options: [
      "Den virtuella IP-adressen 192.168.10.1",
      "MLS1:s fysiska SVI-adress 192.168.10.2",
      "MLS2:s fysiska SVI-adress 192.168.10.3",
      "ISP:s adress 203.0.113.1"
    ],
    correctIndex: 0,
    explanation: "Klienten ska använda den virtuella IP-adressen (192.168.10.1). Adressen flyttas transparent mellan MLS1 och MLS2 vid fel.",
    ref: "PDF Sida 2: 'Klienten använder 192.168.10.1 som default gateway. Adressen tillhör den virtuella routern.'"
  },
  {
    id: 16,
    category: "topology-cli",
    importance: "★ VIKTIG REGEL",
    question: "Varför konfigureras klienten ALDRIG med MLS1:s eller MLS2:s fysiska SVI-adress?",
    options: [
      "För att då förloras redundansen helt – går den switchen ner slutar nätet fungera för klienten.",
      "För att en Cisco-switch inte tillåter att man pingar en SVI-adress.",
      "För att SVI-adresser inte har nätmaskor.",
      "För att fysiska SVI-adresser automatiskt byter IP var 5:e minut."
    ],
    correctIndex: 0,
    explanation: "Klienten använder aldrig MLS1:s eller MLS2:s fysiska SVI-adress som gateway, för om den enheten dör så vet klienten inte att den ska skicka till den andra switchen.",
    ref: "PDF Sida 2: 'Klienten använder aldrig MLS1:s eller MLS:2 fysiska SVI-adress som gateway'"
  },
  {
    id: 17,
    category: "topology-cli",
    importance: "★ CISCO L3 SWITCH",
    question: "Vilket globalt kommando måste ALLTID köras på en Layer 3-switch (som MLS1/MLS2/ISP) för att den ska kunna dirigera IP-paket?",
    options: [
      "ip routing",
      "router rip",
      "routing enable",
      "ip forward-protocol"
    ],
    correctIndex: 0,
    explanation: "Cisco L3-switchar startar med routing inaktiverad. Kommandot 'ip routing' i global configuration mode aktiverar IP-routing på switchen.",
    ref: "PDF Sida 4, 5, 6: 'ISP(config)#ip routing', 'MLS1(config)#ip routing', 'MLS2(config)#ip routing'"
  },
  {
    id: 18,
    category: "topology-cli",
    importance: "★ CISCO L3 INTERFACE",
    question: "Hur konverterar man en fysisk switchport (t.ex. g1/0/3) på en multilayer-switch till en routad L3-port så den kan tilldelas en IP-adress?",
    options: [
      "no switchport",
      "switchport mode routed",
      "ip routed-interface",
      "routing port enable"
    ],
    correctIndex: 0,
    explanation: "Kommandot 'no switchport' tar bort portens Layer 2-egenskaper och gör den till ett rent routat gränssnitt på Layer 3 så att 'ip address x.x.x.x' kan sättas direkt på porten.",
    ref: "PDF Sida 4 & 6: 'ISP(config-if)#no switchport', 'MLS2(config-if)#no switchport'"
  },
  {
    id: 19,
    category: "topology-cli",
    importance: "★ INTERFACE TRACKING",
    question: "Vad gör kommandot 'standby 10 track g1/0/3' på MLS1?",
    options: [
      "Om upplänken g1/0/3 (mot ISP) går ner sänks MLS1:s HSRP-prioritet automatiskt så att MLS2 kan ta över som Active.",
      "Det loggar all trafik på g1/0/3 till en syslog-server.",
      "Det speglar HSRP-paket till Wireshark.",
      "Det stänger av HSRP permanent om interface g1/0/3 flappar."
    ],
    correctIndex: 0,
    explanation: "Interface tracking övervakar länken mot internet. Om länken går ner sänks prioriteten (standard med 10), vilket gör att standby-routern med 'preempt' tar över och trafiken leds ut en fungerande väg!",
    ref: "PDF Sida 5: 'MLS1(config-if)#standby 10 track g1/0/3'"
  },
  {
    id: 20,
    category: "topology-cli",
    importance: "★ FLOATING STATIC ROUTE",
    question: "Varför slutar kommandot 'ip route 192.168.10.0 255.255.255.0 203.0.113.6 5' på ISP med en femma (5)?",
    options: [
      "Siffran 5 sätter administrativ distans (AD) till 5 och skapar en floating static route som backup.",
      "Siffran 5 anger hur många sekunder routingen ska pausas.",
      "Siffran 5 anger att rutten endast gäller för 5 klienter.",
      "Siffran 5 representerar grupp 5 i HSRP."
    ],
    correctIndex: 0,
    explanation: "En vanlig statisk rutt har AD 1 (mot MLS1 203.0.113.2). Genom att sätta AD 5 på rutten mot MLS2 (203.0.113.6) installeras den i routingtabellen först om primärrutten försvinner!",
    ref: "PDF Sida 5: 'ISP(config)#ip route 192.168.10.0 255.255.255.0 203.0.113.6 5'"
  },
  {
    id: 21,
    category: "topology-cli",
    importance: "★ PROVKOMMANDO",
    question: "Vilket kommando aktiverar HSRP version 2 under ett VLAN-gränssnitt?",
    options: [
      "standby version 2",
      "hsrp version 2",
      "standby v2 enable",
      "version hsrp 2"
    ],
    correctIndex: 0,
    explanation: "Korrekt Cisco IOS-kommando på interfacenivå är: 'standby version 2'.",
    ref: "PDF Sida 5 & 6: 'MLS1(config-if)#standby version 2'"
  },
  {
    id: 22,
    category: "topology-cli",
    importance: "★ L2 ACCESS KONFIG",
    question: "Hur konfigureras porten g1/0/2 på MLS1 som ansluter till access-switchen S1?",
    options: [
      "switchport mode access följt av switchport access vlan 10",
      "switchport mode trunk följt av switchport trunk allowed vlan 10",
      "no switchport följt av ip address 192.168.10.2",
      "standby 10 vlan access"
    ],
    correctIndex: 0,
    explanation: "Porten mot S1 konfigureras som accessport till VLAN 10 via: 'switchport mode access' och 'switchport access vlan 10'.",
    ref: "PDF Sida 5: 'switchport mode access(L3 switch till en L2) / switchport access vlan 10'"
  },
  {
    id: 23,
    category: "topology-cli",
    importance: "★ DEFAULT ROUTE",
    question: "Vilket kommando konfigurerar en default route på MLS1 som pekar mot ISP:s port (203.0.113.1)?",
    options: [
      "ip route 0.0.0.0 0.0.0.0 203.0.113.1",
      "ip default-gateway 203.0.113.1",
      "ip route default 203.0.113.1",
      "standby route 0.0.0.0 203.0.113.1"
    ],
    correctIndex: 0,
    explanation: "På en router eller L3-switch med 'ip routing' aktiverat konfigureras default route med 'ip route 0.0.0.0 0.0.0.0 <next-hop-ip>'.",
    ref: "PDF Sida 6: 'MLS1(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.1'"
  },
  {
    id: 24,
    category: "hsrp-core",
    importance: "★ VIKTIG SCENARIOFRÅGA",
    question: "MLS1 har prioritet 105 och MLS2 har prioritet 100. Vad händer om MLS1 kraschar, MLS2 blir Active, och MLS1 sedan startar om IFALL 'preempt' INTE är konfigurerat på MLS1?",
    options: [
      "MLS2 förblir Active och MLS1 blir Standby trots att MLS1 har högre prioritet.",
      "MLS1 tar omedelbart över som Active ändå eftersom prioritet 105 alltid vinner automatiskt.",
      "Båda switcharna stänger ner VLAN 10 på grund av en konflikt.",
      "MLS1 och MLS2 delar upp trafiken 50/50."
    ],
    correctIndex: 0,
    explanation: "Utan preemption tillåts inte en återvändande router att ta över. Routern med högre prioritet blir kvar i standby tills den aktiva routern slutar skicka hellos.",
    ref: "PDF Sida 1: 'Prioritet och preemption i HSRP - Preemption jämför prioritet'"
  },
  {
    id: 25,
    category: "topology-cli",
    importance: "★ SPARA KONFIGURATION",
    question: "Vilket kommando körs i privileged EXEC mode för att spara den aktiva konfigurationen till NVRAM på en Cisco-enhet?",
    options: [
      "copy running-config startup-config (eller write memory)",
      "save config running",
      "store startup-config",
      "nvram write running"
    ],
    correctIndex: 0,
    explanation: "Kommandot är 'copy running-config startup-config' (förkortas ofta 'copy run start' eller 'wr').",
    ref: "PDF Sida 5: 'ISP#copy running-config startup-config'"
  }
];

// ==========================================
// 2B. DIGINTO QUESTION DATABASE
// Source: https://administration-utrustning.diginto.se/fhrp-koncepten/mer-om-fhrp/
//         https://administration-utrustning.diginto.se/fhrp-koncepten/hsrp-oversikt/
// ==========================================
const DIGINTO_QUESTIONS = [
  {
    id: "dig-1",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vilken multicast-adress använder HSRP version 1 respektive HSRP version 2 för Hello-meddelanden enligt Diginto?",
    options: [
      "HSRP version 1 använder 224.0.0.2 och HSRP version 2 använder 224.0.0.102",
      "HSRP version 1 använder 224.0.0.18 och HSRP version 2 använder 224.0.0.2",
      "HSRP version 1 använder 224.0.0.102 och HSRP version 2 använder 224.0.0.254",
      "Båda versionerna skickar broadcast (255.255.255.255) istället för multicast"
    ],
    correctIndex: 0,
    explanation: "Enligt Diginto (Mer om FHRP): HSRP version 1 använder multicast-adressen 224.0.0.2, medan HSRP version 2 använder 224.0.0.102.",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hot Standby Router Protocol)"
  },
  {
    id: "dig-2",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vilken multicast-adress används i VRRP för att skicka annonseringar från Master router?",
    options: [
      "224.0.0.18",
      "224.0.0.2",
      "224.0.0.102",
      "224.0.0.9"
    ],
    correctIndex: 0,
    explanation: "VRRP använder den reserverade multicast-adressen 224.0.0.18 för kommunikation mellan Master och Backup-routrar.",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Virtual Router Redundancy Protocol)"
  },
  {
    id: "dig-3",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vilken multicast-adress använder GLBP för att koordinera lastbalansering mellan routrarna?",
    options: [
      "224.0.0.102",
      "224.0.0.2",
      "224.0.0.18",
      "224.0.0.254"
    ],
    correctIndex: 0,
    explanation: "GLBP använder multicast-adressen 224.0.0.102 för att koordinera lastbalansering och status mellan routrarna i gruppen (samma adress som HSRPv2!).",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    id: "dig-4",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP & HSRP",
    question: "Vad är standardvärdena för Hello-timer och Hold-timer i HSRP enligt Diginto?",
    options: [
      "Hello-timer: 3 sekunder, Hold-timer: 10 sekunder",
      "Hello-timer: 1 sekund, Hold-timer: 3 sekunder",
      "Hello-timer: 5 sekunder, Hold-timer: 15 sekunder",
      "Hello-timer: 10 sekunder, Hold-timer: 30 sekunder"
    ],
    correctIndex: 0,
    explanation: "Standardvärdet för HSRP Hello-timer är 3 sekunder, och Hold-timern (tiden standby väntar innan den tar över) är 10 sekunder.",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ & hsrp-oversikt/"
  },
  {
    id: "dig-5",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vad är standardvärdena för Advertisement-intervall och failover i VRRP enligt Diginto?",
    options: [
      "Advertisement-intervall: 1 sekund, Failover: 3 sekunder",
      "Advertisement-intervall: 3 sekunder, Failover: 10 sekunder",
      "Advertisement-intervall: 5 sekunder, Failover: 15 sekunder",
      "Advertisement-intervall: 10 sekunder, Failover: 30 sekunder"
    ],
    correctIndex: 0,
    explanation: "I VRRP skickar Master-routern uppdateringar var 1 sekund, och failover sker inom 3 sekunder om uppdateringar uteblir.",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: VRRP & Timers i FHRP)"
  },
  {
    id: "dig-6",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vilken är den rekommenderade nedre gränsen för HSRP-timers enligt Diginto, och vad är risken om de sätts för lågt?",
    options: [
      "Hello bör inte sättas under 1 sekund och Hold inte under 4 sekunder (risk för ökad CPU-belastning och instabilitet).",
      "Hello bör inte sättas under 5 sekunder på grund av kabeldämpning.",
      "Hold-timern får aldrig understiga 30 sekunder.",
      "HSRP tillåter överhuvudtaget inte att timers justeras från 3s och 10s."
    ],
    correctIndex: 0,
    explanation: "Diginto betonar: 'Hello-timern bör inte sättas under 1 sekund och Hold-timern inte under 4 sekunder, eftersom detta kan leda till ökad CPU-belastning och instabilitet i standby-tillståndet.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    id: "dig-7",
    category: "election-preempt",
    sourceTag: "🌐 DIGINTO MER OM FHRP & HSRP",
    question: "Om två eller fler routrar i en FHRP/HSRP-grupp har exakt samma prioritet, vad fungerar som 'tiebreaker'?",
    options: [
      "Den högsta numeriska IPv4-adressen på det deltagande interfacet.",
      "Den lägsta MAC-adressen på enhetens moderkort.",
      "Den router som har längst drifttid (uptime).",
      "Den router som har snabbast port (t.ex. 10G över 1G)."
    ],
    correctIndex: 0,
    explanation: "Diginto anger tydligt: 'Om två eller fler routrar har samma prioritet används deras högsta IP-adress som avgörande faktor. Den router med högst IP-adress på det interface som deltar i FHRP-gruppen blir då aktiv.'",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Tiebreaker)"
  },
  {
    id: "dig-8",
    category: "election-preempt",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT (NYCKELREGEL)",
    question: "Vad händer om en router startar med SAMMA prioritet som den aktiva routern men en HÖGRE IPv4-adress, och 'preempt' är aktiverat?",
    options: [
      "Den nya routern tar INTE över som aktiv router, eftersom preemption ENDAST påverkar prioritet och inte IP-adress!",
      "Den nya routern tar omedelbart över rollen som aktiv router på grund av högre IP-adress.",
      "Båda routrarna delar trafiken 50/50 genom round-robin.",
      "HSRP stänger ner interfacet på grund av IP-konflikt."
    ],
    correctIndex: 0,
    explanation: "Mycket viktig detaljregel från Diginto: 'Preemption påverkar ENDAST prioritet, inte IP-adress. En router med samma prioritet men en högre IPv4-adress kommer INTE att ta över rollen som aktiv router.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption)"
  },
  {
    id: "dig-9",
    category: "election-preempt",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vilket intervall kan HSRP-prioritet justeras mellan i Cisco IOS, och vad är standardvärdet?",
    options: [
      "Justeras mellan 0 och 255, med 100 som standardvärde.",
      "Justeras mellan 1 och 100, med 50 som standardvärde.",
      "Justeras mellan 1 och 4096, med 1 som standardvärde.",
      "Justeras mellan 0 och 65535, med 32768 som standardvärde."
    ],
    correctIndex: 0,
    explanation: "Standardvärdet för HSRP-prioritet är 100, men det kan justeras mellan 0 och 255. Kommandot är: 'standby priority <värde>'.",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-prioritet)"
  },
  {
    id: "dig-10",
    category: "election-preempt",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "I Digintos labbexempel: R1 har prioritet 150 och preemption aktiverat. R2 har standardprioritet 100. Ett strömavbrott drabbar R1 och R2 tar över som aktiv. Vad sker när strömmen återställs till R1?",
    options: [
      "R1 återtar automatiskt rollen som aktiv router genom att en ny valprocess utlöses tack vare preemption och högre prioritet (150).",
      "R2 förblir aktiv permanent eftersom en aktiv router aldrig lämnar ifrån sig rollen.",
      "R1 blir Standby och måste startas om via reload för att kunna bli aktiv.",
      "R1 och R2 kraschar på grund av dubbla aktiva routrar (split-brain)."
    ],
    correctIndex: 0,
    explanation: "Diginto: 'När strömmen återställs och R1 kommer online igen, kommer en ny valprocess att utlösas eftersom R1 har högre prioritet och preemption är aktiverat. Detta gör att R1 återtar rollen som aktiv router, medan R2 återgår till standby-läge.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption labbexempel)"
  },
  {
    id: "dig-11",
    category: "election-preempt",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vad gäller om preemption är INAKTIVERAT på samtliga HSRP-routrar under valprocessen?",
    options: [
      "Den router som startar först blir aktiv om inga andra routrar är online vid valprocessen (även om en senare startande router har högre prioritet).",
      "Routern med högst prioritet tar alltid över ändå vid första Hello-paketet.",
      "Ingen router kan någonsin bli aktiv utan kommandot 'standby preempt'.",
      "Routrarna växlar roll varje timme automatiskt."
    ],
    correctIndex: 0,
    explanation: "Diginto: 'Om preemption är inaktiverat kommer den router som startar först att bli aktiv om inga andra routrar är online vid valprocessen.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Obs-ruta)"
  },
  {
    id: "dig-12",
    category: "states-deep",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Hur definierar Diginto HSRP-tillståndet 'Initial'?",
    options: [
      "Routern är i startläge och har ännu inte deltagit i HSRP-gruppen (första tillståndet efter aktivering/omstart).",
      "Routern skickar Hellomeddelanden för att initiera valprocessen.",
      "Routern har vunnit valet och agerar standby-reserv.",
      "Routern lyssnar passivt på klienters ARP-förfrågningar."
    ],
    correctIndex: 0,
    explanation: "Diginto tabell: 'Initial – Routern är i startläge och har ännu inte deltagit i HSRP-gruppen. Detta är det första tillståndet efter att interfacet har aktiverats eller routern startats om.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    id: "dig-13",
    category: "states-deep",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vad är den exakta funktionen för HSRP-tillståndet 'Learn' enligt Diginto?",
    options: [
      "Routern väntar på att ta emot ett Hello-meddelande från en annan HSRP-router för att lära sig den virtuella IP-adressen.",
      "Routern laddar ner routingtabellen via OSPF från den aktiva routern.",
      "Routern lär sig switcharnas portkanaler via LACP.",
      "Routern analyserar nätverkstrafik för att beräkna bandbredd."
    ],
    correctIndex: 0,
    explanation: "Diginto tabell: 'Learn – Routern väntar på att ta emot ett Hello-meddelande från en annan HSRP-router för att lära sig den virtuella IP-adressen. Om den inte får någon information under denna fas, går den över till Speak-tillståndet.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    id: "dig-14",
    category: "states-deep",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Hur beskrivs HSRP-tillståndet 'Listen' i Diginto?",
    options: [
      "Routern lyssnar på Hello-meddelanden men har ingen aktiv roll. Den känner till virtuella IP-adressen och är en passiv medlem i gruppen.",
      "Routern skickar ut ARP-förfrågningar till alla anslutna klienter.",
      "Routern agerar backup för standby-routern och vidarebefordrar hälften av paketen.",
      "Routern väntar på att administratören ska skriva 'no shutdown'."
    ],
    correctIndex: 0,
    explanation: "Diginto tabell: 'Listen – Routern lyssnar på Hello-meddelanden men har ingen aktiv roll. Den känner till den virtuella IP-adressen och är en passiv medlem i HSRP-gruppen.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    id: "dig-15",
    category: "states-deep",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vad gör routern i HSRP-tillståndet 'Speak'?",
    options: [
      "Den skickar ut Hello-meddelanden för att meddela sin närvaro och deltar i valprocessen för att bli aktiv eller standby-router.",
      "Den skickar röstmeddelanden (VoIP) till växeln.",
      "Den stänger ner grannrouterns interface.",
      "Den vidarebefordrar paket till default gateway."
    ],
    correctIndex: 0,
    explanation: "Diginto tabell: 'Speak – Routern skickar ut Hello-meddelanden för att meddela sin närvaro och deltar i valprocessen för att bli aktiv eller standby-router.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    id: "dig-16",
    category: "states-deep",
    sourceTag: "🌐 DIGINTO HSRP ÖVERSIKT",
    question: "Vilket specifikt krav gäller för att en router ska kunna nå statusen 'Active' eller 'Standby'?",
    options: [
      "Den kan endast vara i Active eller Standby-status om den har fått en virtuell IP-adress och genomgått valprocessen.",
      "Den måste ha minst 1 Gbps länk till alla anslutna switchar.",
      "Den måste ha prioritet satt till minst 200.",
      "Den måste köra Cisco IOS version 17 eller senare."
    ],
    correctIndex: 0,
    explanation: "Diginto Obs-ruta: 'En router kan endast vara i Active eller Standby-status om den har fått en virtuell IP-adress och genomgått valprocessen.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    id: "dig-17",
    category: "glbp-deep",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Hur skiljer sig GLBP:s trafikfördelning från traditionell dynamisk lastbalansering enligt Diginto?",
    options: [
      "GLBP använder statisk fördelning enligt en vald algoritm, och övervakar inte aktivt trafikbelastningen för att dynamiskt justera trafiken.",
      "GLBP mäter bandbreddsutnyttjandet på varje länk varje millisekund och flyttar sessioner dynamiskt.",
      "GLBP kan endast användas med statiska IP-adresser utan DHCP.",
      "GLBP fördelar enbart UDP-trafik, medan TCP-trafik blockeras."
    ],
    correctIndex: 0,
    explanation: "Diginto förklarar: 'GLBP använder dock statisk fördelning, vilket innebär att det inte aktivt övervakar trafikbelastningen och dynamiskt justerar trafiken mellan routrarna. Istället sker fördelningen enligt en vald algoritm.'",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    id: "dig-18",
    category: "glbp-deep",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vad innebär metoden 'Per-MAC' vid lastbalansering i GLBP enligt Diginto?",
    options: [
      "Varje router får en unik MAC-adress kopplad till den virtuella gatewayen, och klienter fördelas mellan dessa MAC-adresser för att sprida trafiken.",
      "Routern byter MAC-adress på sin egen fysiska port var 3:e sekund.",
      "Klienternas hårdvaru-MAC-adresser binds permanent i routerns startup-config.",
      "Endast klienter med godkända MAC-adresser tillåts skicka trafik."
    ],
    correctIndex: 0,
    explanation: "Diginto: 'Per-MAC: Varje router får en unik MAC-adress kopplad till den virtuella gatewayen. Klienter fördelas mellan dessa MAC-adresser för att sprida trafiken.'",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    id: "dig-19",
    category: "glbp-deep",
    sourceTag: "🌐 DIGINTO MER OM FHRP",
    question: "Vad innebär metoden 'Per-destination' vid lastbalansering i GLBP enligt Diginto?",
    options: [
      "Trafiken delas upp baserat på destinationens IP-adress, så att varje router ansvarar för trafik till vissa specifika destinationer.",
      "All trafik måste alltid skickas till samma centrala server.",
      "Klienten väljer själv vilken destinationsrouter den vill använda genom traceroute.",
      "Routrarna skickar alltid paket i alfabetisk ordning efter destinationsdomän."
    ],
    correctIndex: 0,
    explanation: "Diginto: 'Per-destination: Trafiken delas upp baserat på destinationens IP-adress. Varje router i GLBP-gruppen ansvarar för att vidarebefordra trafik till vissa destinationer, istället för att slumpmässigt fördela trafiken per klient.'",
    ref: "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    id: "dig-20",
    category: "multicast-timers",
    sourceTag: "🌐 DIGINTO MER OM FHRP & HSRP",
    question: "Vilka två protokollversioner erbjuder Cisco för HSRP enligt Diginto för transparent failover?",
    options: [
      "HSRP och HSRP för IPv6",
      "HSRP och HSRP för AppleTalk",
      "HSRP Standard och HSRP Turbo",
      "Endast HSRP version 1 stöds officiellt av Cisco"
    ],
    correctIndex: 0,
    explanation: "Diginto (HSRP översikt): 'Cisco erbjuder HSRP och HSRP för IPv6 för att säkerställa nätverksanslutning även om default gateway misslyckas.'",
    ref: "diginto.se/fhrp-koncepten/hsrp-oversikt/"
  }
];

// Fisher-Yates Shuffle Utility
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==========================================
// 3. CLI COMMANDS DATABASE (Interactive Trainer)
// ==========================================
// 3. CLI COMMANDS DATABASE (Pure HSRP Trainer)
// ==========================================
const COMMANDS_DB = [
  // 1. HSRP Version & Grund
  {
    id: "cmd-hsrp-v2",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Aktivera HSRP Version 2",
    desc: "På interface vlan 10 måste version 2 aktiveras för att stödja MAC-adresser i intervallet <code class=\"code-inline\">0000.0c9f.f000</code> till <code class=\"code-inline\">0000.0c9f.ffff</code>, IPv6 och gruppnummer upp till 4095.",
    hint: "standby version 2",
    canonical: "standby version 2",
    validRegex: /^standby\s+version\s+2$/i,
    explanation: "Aktiverar HSRP version 2 på det aktuella interfacet."
  },
  {
    id: "cmd-hsrp-v1",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Sätt HSRP Version 1 (Standard)",
    desc: "Konfigurera eller återställ interfacet till HSRP version 1 (standardversion begränsad till grupp 0–255 och MAC 0000.0c07.acxx).",
    hint: "standby version 1",
    canonical: "standby version 1",
    validRegex: /^standby\s+version\s+1$/i,
    explanation: "Sätter interfacet i HSRP version 1-läge."
  },
  {
    id: "cmd-hsrp-ip",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Konfigurera virtuell IP-adress",
    desc: "Skapa HSRP-grupp 10 och tilldela den virtuella IP-adressen <code class=\"code-inline\">192.168.10.1</code> som PC0 och klienterna använder som sin Default Gateway.",
    hint: "standby [grupp] ip [ip-adress]",
    canonical: "standby 10 ip 192.168.10.1",
    validRegex: /^standby\s+10\s+ip\s+192\.168\.10\.1$/i,
    explanation: "Skapar HSRP-grupp 10 och sätter den virtuella gateway-adressen till 192.168.10.1."
  },
  {
    id: "cmd-hsrp-name",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Namnge HSRP-gruppen (Beskrivande namn)",
    desc: "Tilldela HSRP-grupp 10 det logiska beskrivande namnet <code class=\"code-inline\">HSRP_VLAN10</code>.",
    hint: "standby [grupp] name [namn]",
    canonical: "standby 10 name HSRP_VLAN10",
    validRegex: /^standby\s+10\s+name\s+HSRP_VLAN10$/i,
    explanation: "Ger HSRP-gruppen ett unikt textnamn för enkel identifiering i konfigurationen."
  },
  // 2. Prioritet & Preemption
  {
    id: "cmd-hsrp-prio",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Sätt HSRP Prioritet till 105",
    desc: "Sätt prioriteten för grupp 10 till 105 så att MLS1 vinner valet och blir primär router (Active) istället för standardvärdet 100.",
    hint: "standby [grupp] priority [värde]",
    canonical: "standby 10 priority 105",
    validRegex: /^(standby\s+10\s+priority\s+105|standby\s+10\s+prio\s+105)$/i,
    explanation: "Sätter prioritet 105 (standard är 100). Högst prioritet blir Active router."
  },
  {
    id: "cmd-hsrp-preempt",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Aktivera Preemption (standby preempt)",
    desc: "Tillåt routern att ta tillbaka rollen som Active router om den startar om eller återansluts och har högre prioritet än nuvarande aktiv router.",
    hint: "standby [grupp] preempt",
    canonical: "standby 10 preempt",
    validRegex: /^standby\s+10\s+preempt$/i,
    explanation: "Preemption gör att routern jämför prioritet och omedelbart tar över som Active om dess prioritet är högre."
  },
  {
    id: "cmd-hsrp-preempt-delay",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Konfigurera Preempt Delay (30 sekunder)",
    desc: "Fördröj preemption med minst 30 sekunder efter boot så att routingprotokoll (som OSPF/EIGRP) hinner konvergera innan routern tar över klienttrafiken.",
    hint: "standby [grupp] preempt delay minimum [sekunder]",
    canonical: "standby 10 preempt delay minimum 30",
    validRegex: /^(standby\s+10\s+preempt\s+delay\s+minimum\s+30|standby\s+10\s+preempt\s+delay\s+min\s+30)$/i,
    explanation: "Fördröjer övertagandet med 30 sekunder för att undvika svart hål-trafik under routingkonvergens."
  },
  // 3. Tracking & Timers
  {
    id: "cmd-hsrp-track",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Interface Tracking (Övervaka upplänk mot ISP)",
    desc: "Övervaka upplänken g1/0/3 för grupp 10 så att prioriteten sänks automatiskt om länken mot ISP dör.",
    hint: "standby [grupp] track [interface]",
    canonical: "standby 10 track g1/0/3",
    validRegex: /^(standby\s+10\s+track\s+(g1\/0\/3|gigabitethernet\s*1\/0\/3))(\s+10)?$/i,
    explanation: "Interface tracking sänker HSRP-prioriteten vid länkavbrott så att standby-routern tar över."
  },
  {
    id: "cmd-hsrp-track-dec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Interface Tracking med specifik minskning (20)",
    desc: "Konfigurera interface tracking för grupp 10 mot g1/0/3 med ett explicit avdrag på 20 vid avbrott.",
    hint: "standby 10 track g1/0/3 20",
    canonical: "standby 10 track g1/0/3 20",
    validRegex: /^(standby\s+10\s+track\s+(g1\/0\/3|gigabitethernet\s*1\/0\/3)\s+20)$/i,
    explanation: "Minskar routerns prioritet med exakt 20 om det övervakade interfacet går ner."
  },
  {
    id: "cmd-hsrp-timers-sec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Justera HSRP Timers (Sekunder: Hello 1s, Hold 4s)",
    desc: "Sätt HSRP Hello-timer till 1 sekund och Hold-timer till 4 sekunder för snabbare felväxling (enligt Digintos rekommendation).",
    hint: "standby [grupp] timers [hello] [hold]",
    canonical: "standby 10 timers 1 4",
    validRegex: /^standby\s+10\s+timers\s+1\s+4$/i,
    explanation: "Sätter Hello-timer till 1s och Hold-timer till 4s."
  },
  {
    id: "cmd-hsrp-timers-msec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Sub-sekunds Timers (Millisekunder)",
    desc: "Konfigurera millisekund-timers: Hello var 200:e millisekund och Hold-timer till 750 millisekunder.",
    hint: "standby [grupp] timers msec [hello] msec [hold]",
    canonical: "standby 10 timers msec 200 msec 750",
    validRegex: /^standby\s+10\s+timers\s+msec\s+200\s+msec\s+750$/i,
    explanation: "Aktiverar sub-sekundsnivå för Hello och Hold för minimal failover-tid."
  },
  // 4. Autentisering & Säkerhet
  {
    id: "cmd-hsrp-auth-text",
    cat: "auth",
    targetDevice: "MLS1(config-if)#",
    title: "Klartext Autentisering (Plain text)",
    desc: "Säkra HSRP-grupp 10 med klartextlösenordet <code class=\"code-inline\">cisco</code> så att obehöriga enheter inte kan injicera Hello-paket.",
    hint: "standby [grupp] authentication [lösenord]",
    canonical: "standby 10 authentication cisco",
    validRegex: /^standby\s+10\s+authentication\s+cisco$/i,
    explanation: "Sätter klartextautentisering för HSRP-gruppen."
  },
  {
    id: "cmd-hsrp-auth-md5",
    cat: "auth",
    targetDevice: "MLS1(config-if)#",
    title: "MD5 Key-string Autentisering (Kryptografisk)",
    desc: "Aktivera säker kryptografisk MD5-autentisering för grupp 10 med nyckelsträngen <code class=\"code-inline\">CiscoPass1</code>.",
    hint: "standby [grupp] authentication md5 key-string [nyckel]",
    canonical: "standby 10 authentication md5 key-string CiscoPass1",
    validRegex: /^(standby\s+10\s+authentication\s+md5\s+key-string\s+CiscoPass1|standby\s+10\s+auth\s+md5\s+key-string\s+CiscoPass1)$/i,
    explanation: "Skyddar HSRP-meddelanden mot avlyssning och falska Hello-paket med MD5."
  },
  // 5. Show & Debug (Verifiering)
  {
    id: "cmd-show-standby-brief",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby brief (Viktigaste provkommandot)",
    desc: "Visa en snabb sammanfattningstabell över alla HSRP-grupper med kolumnerna Interface, Grp, Pri, P (Preempt), State, Active, Standby och Virtual IP.",
    hint: "show standby brief",
    canonical: "show standby brief",
    validRegex: /^(show\s+standby\s+brief|sh\s+standby\s+brief|sh\s+stand\s+br)$/i,
    explanation: "Ciscos standardkommando för att omedelbart verifiera HSRP-tillstånd på alla grupper."
  },
  {
    id: "cmd-show-standby",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby (Fullständig detaljerad status)",
    desc: "Visa detaljerad HSRP-information inklusive virtuell MAC-adress, exakta timers, aktiva och standby-routrars IP, och trackingstatus.",
    hint: "show standby",
    canonical: "show standby",
    validRegex: /^(show\s+standby|sh\s+standby)$/i,
    explanation: "Visar fullständig detaljvy över HSRP-konfiguration och aktuell driftstatus."
  },
  {
    id: "cmd-show-standby-vlan",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby vlan 10 (Specifikt interface)",
    desc: "Filtrera och visa HSRP-information specifikt för interface VLAN 10.",
    hint: "show standby vlan 10",
    canonical: "show standby vlan 10",
    validRegex: /^(show\s+standby\s+vlan\s+10|sh\s+standby\s+vlan\s+10)$/i,
    explanation: "Visar HSRP-status specifikt för interface vlan 10."
  },
  {
    id: "cmd-debug-standby",
    cat: "show",
    targetDevice: "MLS1#",
    title: "debug standby events (Felsök HSRP-tillstånd)",
    desc: "Felsök HSRP i realtid på konsolen genom att övervaka tillståndsbyten (Speak, Standby, Active) och valprocessen.",
    hint: "debug standby events",
    canonical: "debug standby events",
    validRegex: /^(debug\s+standby\s+events|deb\s+standby\s+events)$/i,
    explanation: "Loggar HSRP-händelser och tillståndsförändringar i realtid."
  }
];

// ==========================================
// 4. FULL CONFIGURATIONS DATABASE (Tab 3)
// ==========================================
const CONFIG_MODELS = {
  mls1: {
    id: "mls1",
    name: "MLS1 (Multilayer Switch 1)",
    role: "HSRP Active • Prio 105 • Preempt • Track",
    contextTitle: "MLS1 Konfiguration & Nätverksroll",
    note: "MLS1 agerar Active router för VLAN 10 med prioritet 105. Har 'standby 10 track g1/0/3' som sänker prioriteten med 10 om ISP-länken går ner.",
    params: [
      { key: "Roll i HSRP", val: "Active (Primär Gateway)" },
      { key: "VLAN 10 Fysisk SVI", val: "192.168.10.2 /24" },
      { key: "Virtuell Gateway IP", val: "192.168.10.1 (Grupp 10)" },
      { key: "HSRP Version & Prio", val: "Version 2, Prioritet 105" },
      { key: "Preemption & Track", val: "Preempt PÅ, Track g1/0/3" },
      { key: "Länk mot ISP (g1/0/3)", val: "203.0.113.2 /30 (no switchport)" },
      { key: "Port mot S1 (g1/0/2)", val: "Access VLAN 10" },
      { key: "Default Route", val: "0.0.0.0 0.0.0.0 203.0.113.1" }
    ],
    fullSolution: 
`MLS1>en
MLS1#conf t
MLS1(config)#ip routing
MLS1(config)#interface g1/0/2
MLS1(config-if)#description ACCESS_TO_S1_G0/1
MLS1(config-if)#switchport mode access
MLS1(config-if)#switchport access vlan 10
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#interface vlan 10
MLS1(config-if)#ip address 192.168.10.2 255.255.255.0
MLS1(config-if)#standby version 2
MLS1(config-if)#standby 10 ip 192.168.10.1
MLS1(config-if)#standby 10 priority 105
MLS1(config-if)#standby 10 preempt
MLS1(config-if)#standby 10 track g1/0/3
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#interface g1/0/3
MLS1(config-if)#no switchport
MLS1(config-if)#ip address 203.0.113.2 255.255.255.252
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
    guidedItems: [
      { prefix: "MLS1(config)#", target: "ip routing", label: "Aktivera routing globalt" },
      { prefix: "MLS1(config-if)#", target: "switchport mode access", label: "Sätt g1/0/2 i access-läge" },
      { prefix: "MLS1(config-if)#", target: "switchport access vlan 10", label: "Tilldela porten till VLAN 10" },
      { prefix: "MLS1(config-if)#", target: "ip address 192.168.10.2 255.255.255.0", label: "SVI IP på interface vlan 10" },
      { prefix: "MLS1(config-if)#", target: "standby version 2", label: "HSRP version 2" },
      { prefix: "MLS1(config-if)#", target: "standby 10 ip 192.168.10.1", label: "HSRP virtuell IP-adress" },
      { prefix: "MLS1(config-if)#", target: "standby 10 priority 105", label: "Sätt prioritet 105" },
      { prefix: "MLS1(config-if)#", target: "standby 10 preempt", label: "Aktivera preemption" },
      { prefix: "MLS1(config-if)#", target: "standby 10 track g1/0/3", label: "Övervaka upplänk g1/0/3" },
      { prefix: "MLS1(config-if)#", target: "no switchport", label: "Routad port på g1/0/3" },
      { prefix: "MLS1(config-if)#", target: "ip address 203.0.113.2 255.255.255.252", label: "IP mot ISP på g1/0/3" },
      { prefix: "MLS1(config)#", target: "ip route 0.0.0.0 0.0.0.0 203.0.113.1", label: "Default route mot ISP" }
    ]
  },

  mls2: {
    id: "mls2",
    name: "MLS2 (Multilayer Switch 2)",
    role: "HSRP Standby • Prio 100 • Preempt",
    contextTitle: "MLS2 Konfiguration & Nätverksroll",
    note: "MLS2 agerar Standby router med standardprioritet 100. Har även 'standby 10 preempt' och tar över om MLS1:s prioritet sjunker under 100 eller om MLS1 kraschar.",
    params: [
      { key: "Roll i HSRP", val: "Standby (Reserv Gateway)" },
      { key: "VLAN 10 Fysisk SVI", val: "192.168.10.3 /24" },
      { key: "Virtuell Gateway IP", val: "192.168.10.1 (Grupp 10)" },
      { key: "HSRP Version & Prio", val: "Version 2, Prioritet 100 (Default)" },
      { key: "Preemption", val: "standby 10 preempt" },
      { key: "Länk mot ISP (g1/0/4)", val: "203.0.113.6 /30 (no switchport)" },
      { key: "Port mot S1 (g1/0/2)", val: "Access VLAN 10" },
      { key: "Default Route", val: "0.0.0.0 0.0.0.0 203.0.113.5" }
    ],
    fullSolution:
`MLS2>en
MLS2#conf t
MLS2(config)#ip routing
MLS2(config)#interface g1/0/2
MLS2(config-if)#description ACCESS_TO_S1_G0/2
MLS2(config-if)#switchport mode access
MLS2(config-if)#switchport access vlan 10
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#interface vlan 10
MLS2(config-if)#ip address 192.168.10.3 255.255.255.0
MLS2(config-if)#standby version 2
MLS2(config-if)#standby 10 ip 192.168.10.1
MLS2(config-if)#standby 10 priority 100
MLS2(config-if)#standby 10 preempt
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#interface g1/0/4
MLS2(config-if)#no switchport
MLS2(config-if)#ip address 203.0.113.6 255.255.255.252
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.5`,
    guidedItems: [
      { prefix: "MLS2(config)#", target: "ip routing", label: "Aktivera routing globalt" },
      { prefix: "MLS2(config-if)#", target: "switchport mode access", label: "Sätt g1/0/2 i access-läge" },
      { prefix: "MLS2(config-if)#", target: "switchport access vlan 10", label: "Tilldela porten till VLAN 10" },
      { prefix: "MLS2(config-if)#", target: "ip address 192.168.10.3 255.255.255.0", label: "SVI IP på interface vlan 10" },
      { prefix: "MLS2(config-if)#", target: "standby version 2", label: "HSRP version 2" },
      { prefix: "MLS2(config-if)#", target: "standby 10 ip 192.168.10.1", label: "Virtuell IP 192.168.10.1" },
      { prefix: "MLS2(config-if)#", target: "standby 10 priority 100", label: "Prioritet 100" },
      { prefix: "MLS2(config-if)#", target: "standby 10 preempt", label: "Aktivera preemption" },
      { prefix: "MLS2(config-if)#", target: "no switchport", label: "Routad port på g1/0/4" },
      { prefix: "MLS2(config-if)#", target: "ip address 203.0.113.6 255.255.255.252", label: "IP mot ISP på g1/0/4" },
      { prefix: "MLS2(config)#", target: "ip route 0.0.0.0 0.0.0.0 203.0.113.5", label: "Default route mot ISP" }
    ]
  },

  isp: {
    id: "isp",
    name: "ISP (Internet Service Provider Switch)",
    role: "L3 Internet Gateway • Floating Static Route",
    contextTitle: "ISP Konfiguration & Nätverksroll",
    note: "ISP har statisk rutt till VLAN 10 (192.168.10.0/24) via MLS1 (203.0.113.2) och en flytande statisk rutt (floating static route) med distans 5 via MLS2 (203.0.113.6).",
    params: [
      { key: "Hostname", val: "ISP" },
      { key: "Routing Status", val: "ip routing aktiverat" },
      { key: "Länk mot MLS1 (g1/0/3)", val: "203.0.113.1 /30" },
      { key: "Länk mot MLS2 (g1/0/4)", val: "203.0.113.5 /30" },
      { key: "Servernätverk (g1/0/24)", val: "SERVER_NETWORK (8.8.8.8/28)" },
      { key: "Primär statisk rutt", val: "192.168.10.0/24 via 203.0.113.2 (AD 1)" },
      { key: "Floating backup rutt", val: "192.168.10.0/24 via 203.0.113.6 AD 5" }
    ],
    fullSolution:
`Switch>enable
Switch#configure terminal
Switch(config)#hostname ISP
ISP(config)#ip routing
ISP(config)#interface g1/0/3
ISP(config-if)#description ROUTED_LINK_TO_MLS1
ISP(config-if)#no switchport
ISP(config-if)#ip address 203.0.113.1 255.255.255.252
ISP(config-if)#no shutdown
ISP(config-if)#exit
ISP(config)#interface g1/0/24
ISP(config-if)#description SERVER_NETWORK
ISP(config-if)#no shutdown
ISP(config-if)#exit
ISP(config)#ip route 192.168.10.0 255.255.255.0 203.0.113.2
ISP(config)#ip route 192.168.10.0 255.255.255.0 203.0.113.6 5
ISP(config)#end
ISP#copy running-config startup-config`,
    guidedItems: [
      { prefix: "Switch(config)#", target: "hostname ISP", label: "Byt hostname till ISP" },
      { prefix: "ISP(config)#", target: "ip routing", label: "Aktivera ip routing" },
      { prefix: "ISP(config-if)#", target: "no switchport", label: "no switchport på g1/0/3" },
      { prefix: "ISP(config-if)#", target: "ip address 203.0.113.1 255.255.255.252", label: "IP mot MLS1 på g1/0/3" },
      { prefix: "ISP(config)#", target: "ip route 192.168.10.0 255.255.255.0 203.0.113.2", label: "Primär statisk rutt via MLS1" },
      { prefix: "ISP(config)#", target: "ip route 192.168.10.0 255.255.255.0 203.0.113.6 5", label: "Floating static route via MLS2 med AD 5" },
      { prefix: "ISP#", target: "copy running-config startup-config", label: "Spara konfigurationen" }
    ]
  }
};

// ==========================================
// 5. APPLICATION STATE
// ==========================================
const state = {
  // Quiz (PDF questions)
  quiz: {
    category: "all",
    shuffledQuestions: [],
    currentIndex: 0,
    scoreCorrect: 0,
    scoreWrong: 0,
    streak: 0,
    answered: false
  },
  // Diginto Quiz
  diginto: {
    category: "all",
    shuffledQuestions: [],
    currentIndex: 0,
    scoreCorrect: 0,
    scoreWrong: 0,
    streak: 0,
    answered: false
  },
  // Commands
  commands: {
    category: "all",
    filteredList: [],
    currentIndex: 0,
    mode: "typing" // 'typing' or 'cards'
  },
  // Configs
  config: {
    currentDevice: "mls1",
    mode: "write" // 'write', 'guided', 'solution'
  },
  // Global continuous streak
  streak: 0
};

// ==========================================
// 6. INITIALIZATION & TAB SWITCHING
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSoundToggle();
  initQuiz();
  initDigintoQuiz();
  initCommands();
  initConfigWorkspace();
  initTopologies();
});

function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      sfx.playClick();
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetPaneId = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

function initSoundToggle() {
  const btn = document.getElementById("soundToggleBtn");
  const icon = document.getElementById("soundIcon");
  const label = btn.querySelector(".btn-label");

  btn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    if (sfx.enabled) {
      icon.textContent = "🔊";
      label.textContent = "Ljud På";
      sfx.playTone(600, 'sine', 0.1);
    } else {
      icon.textContent = "🔇";
      label.textContent = "Ljud Av";
    }
  });
}

// ==========================================
// 7. QUIZ IMPLEMENTATION
// ==========================================
function initQuiz() {
  const restartBtn = document.getElementById("restartQuizBtn");
  const restartFinishedBtn = document.getElementById("restartFinishedQuizBtn");
  const categoryFilter = document.getElementById("quizCategoryFilter");
  const nextBtn = document.getElementById("nextQuestionBtn");
  const skipBtn = document.getElementById("skipQuestionBtn");

  restartBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewQuizSession();
  });

  restartFinishedBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewQuizSession();
  });

  categoryFilter.addEventListener("change", (e) => {
    state.quiz.category = e.target.value;
    startNewQuizSession();
  });

  nextBtn.addEventListener("click", () => {
    sfx.playClick();
    advanceQuizQuestion();
  });

  skipBtn.addEventListener("click", () => {
    advanceQuizQuestion();
  });

  startNewQuizSession();
}

function startNewQuizSession() {
  // Filter questions
  let pool = MASTER_QUESTIONS;
  if (state.quiz.category !== "all") {
    pool = pool.filter(q => q.category === state.quiz.category);
  }

  // Shuffle questions randomly
  state.quiz.shuffledQuestions = shuffleArray(pool).map(q => {
    // For each question, shuffle options and track the correct answer text
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);
    return {
      ...q,
      options: shuffledOpts,
      correctIndex: newCorrectIdx
    };
  });

  state.quiz.currentIndex = 0;
  state.quiz.scoreCorrect = 0;
  state.quiz.scoreWrong = 0;
  state.quiz.streak = 0;
  state.quiz.answered = false;

  updateGlobalScore();

  document.getElementById("quizCard").style.display = "block";
  document.getElementById("quizFinishedCard").style.display = "none";

  renderCurrentQuizQuestion();
}

function renderCurrentQuizQuestion() {
  const currentQ = state.quiz.shuffledQuestions[state.quiz.currentIndex];
  if (!currentQ) {
    showQuizFinished();
    return;
  }

  state.quiz.answered = false;

  // Update Progress Bar
  const total = state.quiz.shuffledQuestions.length;
  const currentNum = state.quiz.currentIndex + 1;
  const percent = (currentNum / total) * 100;

  document.getElementById("quizStepText").textContent = `Fråga ${currentNum} av ${total}`;
  document.getElementById("quizCatBadge").textContent = getCategoryName(currentQ.category);
  document.getElementById("quizScoreDisplay").textContent = `Rätt: ${state.quiz.scoreCorrect} | Fel: ${state.quiz.scoreWrong}`;
  document.getElementById("quizProgressBar").style.width = `${percent}%`;

  // Question Card Elements
  document.getElementById("qNumberPill").textContent = `#${currentNum}`;
  document.getElementById("qImportanceTag").textContent = currentQ.importance || "★ KOMMER PÅ PROV";
  document.getElementById("quizQuestionText").textContent = currentQ.question;

  // Options
  const container = document.getElementById("quizOptionsContainer");
  container.innerHTML = "";

  const keys = ["A", "B", "C", "D"];
  currentQ.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `
      <span class="option-key">${keys[idx]}</span>
      <span class="option-label">${escapeHtml(optText)}</span>
    `;

    btn.addEventListener("click", () => {
      handleOptionSelected(idx, btn);
    });

    container.appendChild(btn);
  });

  // Hide explanation and disable next button
  document.getElementById("quizExplanationBox").style.display = "none";
  document.getElementById("nextQuestionBtn").disabled = true;
}

function handleOptionSelected(selectedIdx, clickedBtn) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const currentQ = state.quiz.shuffledQuestions[state.quiz.currentIndex];
  const isCorrect = selectedIdx === currentQ.correctIndex;
  const allBtns = document.querySelectorAll(".quiz-option-btn");

  allBtns.forEach(b => b.classList.add("locked"));

  if (isCorrect) {
    sfx.playCorrect();
    clickedBtn.classList.add("correct");
    state.quiz.scoreCorrect++;
    state.quiz.streak++;
    state.streak = (state.streak || 0) + 1;
  } else {
    sfx.playWrong();
    clickedBtn.classList.add("wrong");
    allBtns[currentQ.correctIndex].classList.add("correct");
    state.quiz.scoreWrong++;
    state.quiz.streak = 0;
    state.streak = 0;
  }

  // Update in-card score display immediately
  const quizScoreDisp = document.getElementById("quizScoreDisplay");
  if (quizScoreDisp) quizScoreDisp.textContent = `Rätt: ${state.quiz.scoreCorrect} | Fel: ${state.quiz.scoreWrong}`;

  // Dim untouched options
  allBtns.forEach((b, idx) => {
    if (idx !== selectedIdx && idx !== currentQ.correctIndex) {
      b.classList.add("dimmed");
    }
  });

  // Show explanation
  const expBox = document.getElementById("quizExplanationBox");
  const expTitle = document.getElementById("explanationHeader");
  const expIcon = document.getElementById("explanationIcon");
  const expText = document.getElementById("explanationText");
  const expRef = document.getElementById("explanationRef");

  if (isCorrect) {
    expIcon.textContent = "✅";
    expTitle.textContent = "Helt Rätt!";
    expTitle.style.color = "var(--color-success)";
  } else {
    expIcon.textContent = "❌";
    expTitle.textContent = "Tyvärr felaktigt svar";
    expTitle.style.color = "var(--primary-red)";
  }

  expText.textContent = currentQ.explanation;
  expRef.textContent = `Källa: ${currentQ.ref}`;
  expBox.style.display = "block";

  document.getElementById("nextQuestionBtn").disabled = false;
  updateGlobalScore();
}

function advanceQuizQuestion() {
  state.quiz.currentIndex++;
  if (state.quiz.currentIndex < state.quiz.shuffledQuestions.length) {
    renderCurrentQuizQuestion();
  } else {
    showQuizFinished();
  }
}

function showQuizFinished() {
  document.getElementById("quizCard").style.display = "none";
  const finishedCard = document.getElementById("quizFinishedCard");
  finishedCard.style.display = "block";

  const total = state.quiz.shuffledQuestions.length;
  const correct = state.quiz.scoreCorrect;
  const pct = Math.round((correct / total) * 100);

  sfx.playWin();

  document.getElementById("finalScoreLead").textContent = `Du fick ${correct} av ${total} rätt (${pct}%)`;
  document.getElementById("finalScoreBreakdown").innerHTML = `
    <div style="margin-bottom: 0.5rem;"><strong>Resultat:</strong></div>
    <div>✅ Antal rätt: <strong>${correct}</strong></div>
    <div>❌ Antal fel: <strong>${state.quiz.scoreWrong}</strong></div>
    <div>🔥 Högsta streak i omgången: <strong>${state.quiz.streak}</strong></div>
    <div style="margin-top: 0.8rem; font-size: 0.88rem; color: #ff99ac;">
      ${pct >= 85 ? '🌟 Fantastiskt! Du är helt redo för provet på FHRP & HSRP!' : pct >= 60 ? '👍 Bra jobbat! Träna lite mer på detaljer som MAC-adresser och VRRP för full pott.' : '💪 Fortsätt öva! Kolla fliken "Snabbguide & Provfusk" och kör en ny omgång.'}
    </div>
  `;
}

function updateGlobalScore() {
  const scoreEl = document.getElementById("globalQuizScore");
  const streakEl = document.getElementById("globalStreak");
  if (!scoreEl || !streakEl) return;

  const totalAnswered = (state.quiz.scoreCorrect + state.quiz.scoreWrong) +
                        (state.diginto ? (state.diginto.scoreCorrect + state.diginto.scoreWrong) : 0);
  const totalCorrect = state.quiz.scoreCorrect + (state.diginto ? state.diginto.scoreCorrect : 0);
  const currentStreak = Math.max(state.quiz.streak, state.diginto ? state.diginto.streak : 0);

  scoreEl.textContent = `${totalCorrect} / ${totalAnswered}`;
  streakEl.textContent = `🔥 ${currentStreak}`;
}

function getCategoryName(cat) {
  switch (cat) {
    case "fhrp-intro": return "FHRP Protokolljämförelse";
    case "hsrp-core": return "HSRP Detaljer & MAC/Port";
    case "hsrp-states": return "HSRP 6 Tillstånd";
    case "vrrp-glbp": return "VRRP & GLBP";
    case "topology-cli": return "Topologi & Kommandon";
    default: return "Allmänt Prov";
  }
}

// ==========================================
// 7B. DIGINTO QUIZ IMPLEMENTATION
// ==========================================
function initDigintoQuiz() {
  const restartBtn = document.getElementById("restartDigintoBtn");
  const restartFinishedBtn = document.getElementById("restartFinishedDigintoBtn");
  const categoryFilter = document.getElementById("digintoCategoryFilter");
  const nextBtn = document.getElementById("nextDigintoBtn");
  const skipBtn = document.getElementById("skipDigintoBtn");

  if (!restartBtn) return;

  restartBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewDigintoSession();
  });

  if (restartFinishedBtn) {
    restartFinishedBtn.addEventListener("click", () => {
      sfx.playClick();
      startNewDigintoSession();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      state.diginto.category = e.target.value;
      startNewDigintoSession();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      sfx.playClick();
      advanceDigintoQuestion();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      advanceDigintoQuestion();
    });
  }

  startNewDigintoSession();
}

function startNewDigintoSession() {
  let pool = DIGINTO_QUESTIONS;
  if (state.diginto.category !== "all") {
    pool = pool.filter(q => q.category === state.diginto.category);
  }

  // Automatically shuffle both questions and answer choices
  state.diginto.shuffledQuestions = shuffleArray(pool).map(q => {
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);
    return {
      ...q,
      options: shuffledOpts,
      correctIndex: newCorrectIdx
    };
  });

  state.diginto.currentIndex = 0;
  state.diginto.scoreCorrect = 0;
  state.diginto.scoreWrong = 0;
  state.diginto.streak = 0;
  state.diginto.answered = false;

  updateGlobalScore();

  const card = document.getElementById("digintoCard");
  const finCard = document.getElementById("digintoFinishedCard");
  if (card) card.style.display = "block";
  if (finCard) finCard.style.display = "none";

  renderCurrentDigintoQuestion();
}

function renderCurrentDigintoQuestion() {
  const currentQ = state.diginto.shuffledQuestions[state.diginto.currentIndex];
  if (!currentQ) {
    showDigintoFinished();
    return;
  }

  state.diginto.answered = false;

  // Update Progress Bar
  const total = state.diginto.shuffledQuestions.length;
  const currentNum = state.diginto.currentIndex + 1;
  const percent = (currentNum / total) * 100;

  const stepText = document.getElementById("digintoStepText");
  const catBadge = document.getElementById("digintoCatBadge");
  const scoreDisp = document.getElementById("digintoScoreDisplay");
  const progBar = document.getElementById("digintoProgressBar");

  if (stepText) stepText.textContent = `Fråga ${currentNum} av ${total}`;
  if (catBadge) catBadge.textContent = getDigintoCategoryName(currentQ.category);
  if (scoreDisp) scoreDisp.textContent = `Rätt: ${state.diginto.scoreCorrect} | Fel: ${state.diginto.scoreWrong}`;
  if (progBar) progBar.style.width = `${percent}%`;

  // Question Card Elements
  const pill = document.getElementById("digintoNumberPill");
  const sourceTag = document.getElementById("digintoSourceTag");
  const qText = document.getElementById("digintoQuestionText");

  if (pill) pill.textContent = `#${currentNum}`;
  if (sourceTag) sourceTag.textContent = currentQ.sourceTag || "🌐 DIGINTO CCNA 2";
  if (qText) qText.textContent = currentQ.question;

  // Options
  const container = document.getElementById("digintoOptionsContainer");
  if (!container) return;
  container.innerHTML = "";

  const keys = ["A", "B", "C", "D"];
  currentQ.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `
      <span class="option-key">${keys[idx]}</span>
      <span class="option-label">${escapeHtml(optText)}</span>
    `;

    btn.addEventListener("click", () => {
      handleDigintoOptionSelected(idx, btn);
    });

    container.appendChild(btn);
  });

  // Reset explanation and next button
  const expBox = document.getElementById("digintoExplanationBox");
  const nextBtn = document.getElementById("nextDigintoBtn");
  if (expBox) expBox.style.display = "none";
  if (nextBtn) nextBtn.disabled = true;
}

function handleDigintoOptionSelected(selectedIdx, clickedBtn) {
  if (state.diginto.answered) return;
  state.diginto.answered = true;

  const currentQ = state.diginto.shuffledQuestions[state.diginto.currentIndex];
  const isCorrect = selectedIdx === currentQ.correctIndex;
  const container = document.getElementById("digintoOptionsContainer");
  const allBtns = container ? container.querySelectorAll(".quiz-option-btn") : [];

  allBtns.forEach(b => b.classList.add("locked"));

  if (isCorrect) {
    sfx.playCorrect();
    clickedBtn.classList.add("correct");
    state.diginto.scoreCorrect++;
    state.diginto.streak++;
    state.streak = (state.streak || 0) + 1;
  } else {
    sfx.playWrong();
    clickedBtn.classList.add("wrong");
    if (allBtns[currentQ.correctIndex]) {
      allBtns[currentQ.correctIndex].classList.add("correct");
    }
    state.diginto.scoreWrong++;
    state.diginto.streak = 0;
    state.streak = 0;
  }

  // Update in-card score display immediately
  const digintoScoreDisp = document.getElementById("digintoScoreDisplay");
  if (digintoScoreDisp) digintoScoreDisp.textContent = `Rätt: ${state.diginto.scoreCorrect} | Fel: ${state.diginto.scoreWrong}`;

  // Dim untouched options
  allBtns.forEach((b, idx) => {
    if (idx !== selectedIdx && idx !== currentQ.correctIndex) {
      b.classList.add("dimmed");
    }
  });

  // Show explanation
  const expBox = document.getElementById("digintoExplanationBox");
  const expTitle = document.getElementById("digintoExplanationHeader");
  const expIcon = document.getElementById("digintoExplanationIcon");
  const expText = document.getElementById("digintoExplanationText");
  const expRef = document.getElementById("digintoExplanationRef");

  if (isCorrect) {
    if (expIcon) expIcon.textContent = "✅";
    if (expTitle) {
      expTitle.textContent = "Helt Rätt!";
      expTitle.style.color = "var(--color-success)";
    }
  } else {
    if (expIcon) expIcon.textContent = "❌";
    if (expTitle) {
      expTitle.textContent = "Tyvärr felaktigt svar";
      expTitle.style.color = "var(--primary-red)";
    }
  }

  if (expText) expText.textContent = currentQ.explanation;
  if (expRef) expRef.textContent = `Källa: ${currentQ.ref}`;
  if (expBox) expBox.style.display = "block";

  const nextBtn = document.getElementById("nextDigintoBtn");
  if (nextBtn) nextBtn.disabled = false;
  updateGlobalScore();
}

function advanceDigintoQuestion() {
  state.diginto.currentIndex++;
  if (state.diginto.currentIndex < state.diginto.shuffledQuestions.length) {
    renderCurrentDigintoQuestion();
  } else {
    showDigintoFinished();
  }
}

function showDigintoFinished() {
  const card = document.getElementById("digintoCard");
  const finCard = document.getElementById("digintoFinishedCard");
  if (card) card.style.display = "none";
  if (finCard) finCard.style.display = "block";

  const total = state.diginto.shuffledQuestions.length;
  const correct = state.diginto.scoreCorrect;
  const pct = Math.round((correct / total) * 100);

  sfx.playWin();

  const lead = document.getElementById("digintoFinalScoreLead");
  const breakdown = document.getElementById("digintoFinalScoreBreakdown");

  if (lead) lead.textContent = `Du fick ${correct} av ${total} rätt (${pct}%)`;
  if (breakdown) {
    breakdown.innerHTML = `
      <div style="margin-bottom: 0.5rem;"><strong>Resultat för Diginto FHRP & HSRP:</strong></div>
      <div>✅ Antal rätt: <strong>${correct}</strong></div>
      <div>❌ Antal fel: <strong>${state.diginto.scoreWrong}</strong></div>
      <div>🔥 Högsta streak i omgången: <strong>${state.diginto.streak}</strong></div>
      <div style="margin-top: 0.8rem; font-size: 0.88rem; color: #ff99ac;">
        ${pct >= 85 ? '🌟 Mästerligt! Du behärskar alla Diginto-koncept inför provet!' : pct >= 60 ? '👍 Bra jobbat! Repetera reglerna för preemption och timers för maximal förståelse.' : '💪 Fortsätt öva! Läs igenom Diginto-länkarna och kör en ny omgång.'}
      </div>
    `;
  }
}

function getDigintoCategoryName(cat) {
  switch (cat) {
    case "multicast-timers": return "Multicast & Timers";
    case "election-preempt": return "Valprocess & Preemption";
    case "states-deep": return "HSRP 6 Tillstånd";
    case "glbp-deep": return "GLBP Lastbalansering";
    default: return "Diginto Kursmaterial";
  }
}

// ==========================================
// 8. CLI COMMANDS TRAINER (Tab 2)
// ==========================================
function initCommands() {
  // Category chips
  const chips = document.querySelectorAll(".cmd-cat-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      sfx.playClick();
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.commands.category = chip.getAttribute("data-cat");
      filterAndRenderCommands();
    });
  });

  // Mode buttons (Typing vs Cards)
  const typeBtn = document.getElementById("cmdModeTypeBtn");
  const cardBtn = document.getElementById("cmdModeCardBtn");

  typeBtn.addEventListener("click", () => {
    sfx.playClick();
    typeBtn.classList.add("active");
    cardBtn.classList.remove("active");
    document.getElementById("cmdTypingView").style.display = "block";
    document.getElementById("cmdCardsView").style.display = "none";
  });

  cardBtn.addEventListener("click", () => {
    sfx.playClick();
    cardBtn.classList.add("active");
    typeBtn.classList.remove("active");
    document.getElementById("cmdTypingView").style.display = "none";
    document.getElementById("cmdCardsView").style.display = "block";
    renderFlashcards();
  });

  // Terminal actions
  const input = document.getElementById("terminalInput");
  const submitBtn = document.getElementById("submitCmdBtn");
  const hintBtn = document.getElementById("showCmdHintBtn");
  const answerBtn = document.getElementById("showCmdAnswerBtn");
  const nextCmdBtn = document.getElementById("nextCmdBtn");

  submitBtn.addEventListener("click", () => submitTerminalCommand());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitTerminalCommand();
    }
  });

  hintBtn.addEventListener("click", () => {
    const hintBox = document.getElementById("cmdHintBox");
    const cmd = state.commands.filteredList[state.commands.currentIndex];
    if (cmd) {
      document.getElementById("cmdHintText").textContent = cmd.hint;
      hintBox.style.display = "flex";
    }
  });

  answerBtn.addEventListener("click", () => {
    const cmd = state.commands.filteredList[state.commands.currentIndex];
    if (cmd) {
      input.value = cmd.canonical;
      input.focus();
    }
  });

  nextCmdBtn.addEventListener("click", () => {
    sfx.playClick();
    state.commands.currentIndex = (state.commands.currentIndex + 1) % state.commands.filteredList.length;
    renderCurrentCommand();
  });

  filterAndRenderCommands();
}

function filterAndRenderCommands() {
  if (state.commands.category === "all") {
    state.commands.filteredList = [...COMMANDS_DB];
  } else {
    state.commands.filteredList = COMMANDS_DB.filter(c => c.cat === state.commands.category);
  }
  state.commands.currentIndex = 0;
  renderCurrentCommand();
  renderCommandSidebar();
  renderFlashcards();
}

function renderCurrentCommand() {
  const cmd = state.commands.filteredList[state.commands.currentIndex];
  if (!cmd) return;

  document.getElementById("cmdTargetDevice").textContent = cmd.targetDevice;
  document.getElementById("termPrompt").textContent = cmd.targetDevice;
  document.getElementById("cmdCounter").textContent = `${state.commands.currentIndex + 1} / ${state.commands.filteredList.length}`;
  document.getElementById("cmdGoalTitle").textContent = cmd.title;
  document.getElementById("cmdGoalDesc").innerHTML = cmd.desc;
  document.getElementById("cmdHintBox").style.display = "none";
  document.getElementById("cmdFeedbackBar").style.display = "none";

  const input = document.getElementById("terminalInput");
  input.value = "";
  input.focus();

  // Reset terminal log
  const log = document.getElementById("terminalLog");
  log.innerHTML = `
    <div class="term-line output">Cisco IOS Software, C3650 Multilayer Switch CLI</div>
    <div class="term-line output">Mål: ${cmd.title}</div>
    <div class="term-line instruction">Skriv kommandot vid prompten nedan och tryck Enter:</div>
  `;

  // Highlight active in sidebar
  const items = document.querySelectorAll(".cmd-list-item");
  items.forEach((item, idx) => {
    if (idx === state.commands.currentIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function renderCommandSidebar() {
  const container = document.getElementById("commandQuickList");
  container.innerHTML = "";

  state.commands.filteredList.forEach((cmd, idx) => {
    const item = document.createElement("div");
    item.className = `cmd-list-item ${idx === state.commands.currentIndex ? 'active' : ''}`;
    item.innerHTML = `
      <div class="cmd-item-code">${escapeHtml(cmd.canonical)}</div>
      <div class="cmd-item-desc">${escapeHtml(cmd.title)}</div>
    `;

    item.addEventListener("click", () => {
      sfx.playClick();
      state.commands.currentIndex = idx;
      renderCurrentCommand();
    });

    container.appendChild(item);
  });
}

function renderFlashcards() {
  const container = document.getElementById("commandCardsGrid");
  container.innerHTML = "";

  state.commands.filteredList.forEach(cmd => {
    const card = document.createElement("div");
    card.className = "flashcard";
    card.innerHTML = `
      <div>
        <div class="fc-tag">${cmd.targetDevice}</div>
        <div class="fc-question">${cmd.title}</div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${cmd.desc}</p>
      </div>
      <div class="fc-answer">
        <code style="font-weight: 700;">${cmd.canonical}</code>
      </div>
    `;
    container.appendChild(card);
  });
}

function submitTerminalCommand() {
  const input = document.getElementById("terminalInput");
  const val = input.value.trim();
  if (!val) return;

  const cmd = state.commands.filteredList[state.commands.currentIndex];
  const isMatch = cmd.validRegex.test(val);
  const log = document.getElementById("terminalLog");
  const feedback = document.getElementById("cmdFeedbackBar");

  // Append user input to terminal
  const userLine = document.createElement("div");
  userLine.className = "term-line";
  userLine.innerHTML = `<strong>${cmd.targetDevice}</strong> ${escapeHtml(val)}`;
  log.appendChild(userLine);

  const responseLine = document.createElement("div");
  responseLine.className = `term-line ${isMatch ? 'success' : 'error'}`;

  if (isMatch) {
    sfx.playCorrect();
    responseLine.textContent = `% Rätt kommando! Syntax verifierad.`;
    log.appendChild(responseLine);

    feedback.className = "cmd-feedback-bar correct";
    feedback.textContent = `✅ Utmärkt! "${val}" är korrekt. ${cmd.explanation}`;
    feedback.style.display = "block";
  } else {
    sfx.playWrong();
    responseLine.textContent = `% Invalid input detected at '^' marker or syntax mismatch.`;
    log.appendChild(responseLine);

    feedback.className = "cmd-feedback-bar wrong";
    feedback.innerHTML = `❌ Felaktigt kommando. Rätt syntax är: <code class="code-inline">${cmd.canonical}</code>`;
    feedback.style.display = "block";
  }

  log.scrollTop = log.scrollHeight;
}

// ==========================================
// 9. FULL CONFIGURATIONS WORKSPACE (Tab 3)
// ==========================================
function initConfigWorkspace() {
  // Device selector buttons
  const devBtns = document.querySelectorAll(".device-btn");
  devBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playClick();
      devBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.config.currentDevice = btn.getAttribute("data-device");
      loadDeviceConfiguration();
    });
  });

  // Editor mode tabs
  const writeTab = document.getElementById("editorWriteTab");
  const guidedTab = document.getElementById("editorGuidedTab");
  const solTab = document.getElementById("editorSolutionTab");

  writeTab.addEventListener("click", () => setEditorMode("write"));
  guidedTab.addEventListener("click", () => setEditorMode("guided"));
  solTab.addEventListener("click", () => setEditorMode("solution"));

  // Editor tool buttons
  document.getElementById("loadTemplateBtn").addEventListener("click", () => {
    loadEditorTemplate();
  });

  document.getElementById("clearEditorBtn").addEventListener("click", () => {
    document.getElementById("configCodeEditor").value = "";
    updateLineNumbers();
  });

  document.getElementById("copySolutionBtn").addEventListener("click", () => {
    const dev = CONFIG_MODELS[state.config.currentDevice];
    if (dev) {
      navigator.clipboard.writeText(dev.fullSolution);
      alert("Facit kopierat till urklipp!");
    }
  });

  // Validation
  document.getElementById("validateConfigBtn").addEventListener("click", () => {
    validateUserConfiguration();
  });

  // Guided check
  document.getElementById("checkGuidedBtn").addEventListener("click", () => {
    validateGuidedInputs();
  });

  // Code editor textarea line numbers sync
  const textarea = document.getElementById("configCodeEditor");
  textarea.addEventListener("input", updateLineNumbers);
  textarea.addEventListener("scroll", () => {
    document.getElementById("editorLineNumbers").scrollTop = textarea.scrollTop;
  });

  loadDeviceConfiguration();
}

function setEditorMode(mode) {
  sfx.playClick();
  state.config.mode = mode;

  document.getElementById("editorWriteTab").classList.toggle("active", mode === "write");
  document.getElementById("editorGuidedTab").classList.toggle("active", mode === "guided");
  document.getElementById("editorSolutionTab").classList.toggle("active", mode === "solution");

  document.getElementById("editorTextView").style.display = mode === "write" ? "block" : "none";
  document.getElementById("editorGuidedView").style.display = mode === "guided" ? "block" : "none";
  document.getElementById("editorSolutionView").style.display = mode === "solution" ? "block" : "none";
  document.getElementById("validationDrawer").style.display = "none";

  if (mode === "guided") {
    renderGuidedInputs();
  }
}

function loadDeviceConfiguration() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  if (!dev) return;

  document.getElementById("cfgContextTitle").textContent = dev.contextTitle;
  document.getElementById("cfgRoleBadge").textContent = dev.role;
  document.getElementById("cfgImportantNote").textContent = dev.note;

  // Render params table
  const table = document.getElementById("cfgParamsTable");
  table.innerHTML = "";
  dev.params.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(p.key)}</td><td>${escapeHtml(p.val)}</td>`;
    table.appendChild(tr);
  });

  // Update Mini Topology SVG
  renderMiniTopology(state.config.currentDevice);

  // Update Solution block
  document.getElementById("solutionCodeBlock").textContent = dev.fullSolution;

  // Update Guided View if active
  if (state.config.mode === "guided") {
    renderGuidedInputs();
  }

  // Reset Drawer
  document.getElementById("validationDrawer").style.display = "none";
}

function updateLineNumbers() {
  const textarea = document.getElementById("configCodeEditor");
  const lines = textarea.value.split("\n").length;
  const lineNumbersEl = document.getElementById("editorLineNumbers");
  lineNumbersEl.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");
}

function loadEditorTemplate() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  let template = "";
  if (state.config.currentDevice === "isp") {
    template = `Switch>enable\nSwitch#configure terminal\nSwitch(config)#hostname ISP\nISP(config)#ip routing\nISP(config)#interface g1/0/3\n! Skriv länk mot MLS1 här...\n\nISP(config)#ip route ...`;
  } else if (state.config.currentDevice === "mls1") {
    template = `MLS1>en\nMLS1#conf t\nMLS1(config)#ip routing\nMLS1(config)#interface g1/0/2\n! Konfigurera access mot S1 här...\n\nMLS1(config)#interface vlan 10\n! Konfigurera SVI och HSRP här...\n\nMLS1(config)#interface g1/0/3\n! Konfigurera länk mot ISP här...\n\nMLS1(config)#ip route 0.0.0.0 0.0.0.0 ...`;
  } else {
    template = `MLS2>en\nMLS2#conf t\nMLS2(config)#ip routing\nMLS2(config)#interface g1/0/2\n! Konfigurera access mot S1 här...\n\nMLS2(config)#interface vlan 10\n! Konfigurera SVI och HSRP här...\n\nMLS2(config)#interface g1/0/4\n! Konfigurera länk mot ISP här...\n\nMLS2(config)#ip route 0.0.0.0 0.0.0.0 ...`;
  }
  const textarea = document.getElementById("configCodeEditor");
  textarea.value = template;
  updateLineNumbers();
}

function renderGuidedInputs() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const container = document.getElementById("guidedInputsContainer");
  container.innerHTML = "";

  dev.guidedItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "guided-line-row";
    row.innerHTML = `
      <div class="guided-prompt-prefix">${item.prefix}</div>
      <input type="text" class="guided-input" data-idx="${idx}" placeholder="${escapeHtml(item.label)}" autocomplete="off" spellcheck="false">
    `;
    container.appendChild(row);
  });
}

function validateGuidedInputs() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const inputs = document.querySelectorAll(".guided-input");
  let correctCount = 0;

  inputs.forEach((input, idx) => {
    const expected = dev.guidedItems[idx].target.toLowerCase().replace(/\s+/g, " ").trim();
    const actual = input.value.toLowerCase().replace(/\s+/g, " ").trim();

    if (actual === expected || isLooseCommandMatch(actual, expected)) {
      input.classList.remove("wrong");
      input.classList.add("correct");
      correctCount++;
    } else {
      input.classList.remove("correct");
      input.classList.add("wrong");
    }
  });

  if (correctCount === dev.guidedItems.length) {
    sfx.playWin();
    alert(`🎉 Perfekt! Alla ${correctCount} rader är helt rätt!`);
  } else {
    sfx.playWrong();
    alert(`Du hade ${correctCount} av ${dev.guidedItems.length} rätt. De felaktiga raderna är rödmarkerade.`);
  }
}

function validateUserConfiguration() {
  const userText = document.getElementById("configCodeEditor").value;
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const drawer = document.getElementById("validationDrawer");
  const detailsList = document.getElementById("validationDetailsList");
  const scoreBadge = document.getElementById("drawerScoreBadge");

  drawer.style.display = "block";
  detailsList.innerHTML = "";

  // Normalize user lines
  const userLines = userText
    .split("\n")
    .map(l => l.replace(/^[a-zA-Z0-9_-]+(\(config[a-z-]*\))?#\s*/i, "").trim()) // strip Cisco prompt prefix if pasted
    .filter(l => l && !l.startsWith("!") && !l.startsWith("%"));

  // Check expected key command blocks
  const expectedItems = dev.guidedItems;
  let matches = 0;

  expectedItems.forEach(item => {
    const target = item.target.toLowerCase();
    const found = userLines.some(ul => isLooseCommandMatch(ul.toLowerCase(), target));

    const row = document.createElement("div");
    if (found) {
      matches++;
      row.className = "val-item match";
      row.innerHTML = `<span>✓</span> <div><strong>${escapeHtml(item.target)}</strong> — ${escapeHtml(item.label)}</div>`;
    } else {
      row.className = "val-item missing";
      row.innerHTML = `<span>✕</span> <div><strong>Saknas: ${escapeHtml(item.target)}</strong> (${escapeHtml(item.label)})</div>`;
    }
    detailsList.appendChild(row);
  });

  const percentage = Math.round((matches / expectedItems.length) * 100);
  scoreBadge.textContent = `${percentage}% rätt (${matches}/${expectedItems.length})`;

  if (percentage >= 90) {
    sfx.playCorrect();
    scoreBadge.style.color = "var(--color-success)";
    document.getElementById("editorValidationSummary").textContent = `🎉 Utmärkt! Konfigurationen för ${dev.name} är godkänd.`;
  } else {
    sfx.playWrong();
    scoreBadge.style.color = "var(--primary-red)";
    document.getElementById("editorValidationSummary").textContent = `Se feedback nedan för saknade kommandon (${percentage}% matchning).`;
  }
}

function isLooseCommandMatch(actual, expected) {
  // Normalize whitespace
  actual = actual.replace(/\s+/g, " ").trim();
  expected = expected.replace(/\s+/g, " ").trim();

  if (actual === expected) return true;

  // Common Cisco abbreviations
  const synonyms = [
    { from: /\bconf\s+t\b/g, to: "configure terminal" },
    { from: /\bint\b/g, to: "interface" },
    { from: /\bsw\s+mo\s+acc\b/g, to: "switchport mode access" },
    { from: /\bsw\s+acc\s+vlan\b/g, to: "switchport access vlan" },
    { from: /\bno\s+shut\b/g, to: "no shutdown" },
    { from: /\bip\s+addr\b/g, to: "ip address" },
    { from: /\bcopy\s+run\s+start\b/g, to: "copy running-config startup-config" }
  ];

  let normAct = actual;
  synonyms.forEach(s => normAct = normAct.replace(s.from, s.to));

  return normAct === expected;
}

function renderMiniTopology(deviceKey) {
  const svg = document.getElementById("miniTopoSvg");
  // Simple illustrative SVG based on active device
  let colorMls1 = deviceKey === "mls1" ? "#ff2a5f" : "#552233";
  let colorMls2 = deviceKey === "mls2" ? "#ff9900" : "#553311";
  let colorIsp = deviceKey === "isp" ? "#e60039" : "#441122";

  svg.innerHTML = `
    <line x1="270" y1="50" x2="130" y2="150" stroke="${deviceKey === 'mls1' || deviceKey === 'isp' ? '#ff2a5f' : '#331520'}" stroke-width="3"/>
    <line x1="270" y1="50" x2="410" y2="150" stroke="${deviceKey === 'mls2' || deviceKey === 'isp' ? '#ff9900' : '#331520'}" stroke-width="3" stroke-dasharray="4,4"/>
    <line x1="130" y1="150" x2="270" y2="230" stroke="#00d2ff" stroke-width="2.5"/>
    <line x1="410" y1="150" x2="270" y2="230" stroke="#00d2ff" stroke-width="2.5"/>

    <!-- ISP -->
    <circle cx="270" cy="50" r="24" fill="${colorIsp}" stroke="#fff" stroke-width="2"/>
    <text x="270" y="55" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">ISP</text>
    <text x="270" y="22" fill="#a0aec0" font-size="9" text-anchor="middle">203.0.113.1 / .5</text>

    <!-- MLS1 -->
    <circle cx="130" cy="150" r="28" fill="${colorMls1}" stroke="#fff" stroke-width="${deviceKey === 'mls1' ? '3' : '1.5'}"/>
    <text x="130" y="154" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">MLS1</text>
    <text x="130" y="195" fill="#ff99ac" font-size="9" text-anchor="middle">SVI: .2 | Prio 105</text>

    <!-- MLS2 -->
    <circle cx="410" cy="150" r="28" fill="${colorMls2}" stroke="#fff" stroke-width="${deviceKey === 'mls2' ? '3' : '1.5'}"/>
    <text x="410" y="154" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">MLS2</text>
    <text x="410" y="195" fill="#ffb300" font-size="9" text-anchor="middle">SVI: .3 | Prio 100</text>

    <!-- Virtual Router Center -->
    <rect x="200" y="135" width="140" height="30" rx="5" fill="#0d1b2a" stroke="#00d2ff" stroke-width="1.2"/>
    <text x="270" y="154" fill="#00f2fe" font-size="10" font-weight="bold" text-anchor="middle">VIP: 192.168.10.1</text>

    <!-- S1 -->
    <rect x="235" y="215" width="70" height="24" rx="4" fill="#1a202c" stroke="#00d2ff" stroke-width="1.5"/>
    <text x="270" y="231" fill="#fff" font-size="10" text-anchor="middle">S1 (Switch)</text>
  `;
}

// ==========================================
// 10. INTERACTIVE TOPOLOGY & NODE INSPECTOR (Tab 4)
// ==========================================
function initTopologies() {
  const topoBtns = document.querySelectorAll(".topo-tab-btn");
  topoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playClick();
      topoBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetTopo = btn.getAttribute("data-topo");
      document.getElementById("topoView1").style.display = targetTopo === "topo1" ? "block" : "none";
      document.getElementById("topoView2").style.display = targetTopo === "topo2" ? "block" : "none";
    });
  });

  // Node clicks in Topology 1
  setupNodeClick("node-mls1", "MLS1 (Multilayer Switch)", "Active HSRP Gateway", `
    <strong>Port Gig1/0/3:</strong> 203.0.113.2 /30 mot ISP (Routad L3-port via <code class="code-inline">no switchport</code>)<br>
    <strong>Port Gig1/0/2:</strong> Accessport för VLAN 10 mot S1<br>
    <strong>Interface VLAN 10:</strong> Fysisk IP 192.168.10.2 /24<br>
    <strong>HSRP Konfiguration:</strong> Grupp 10, Virtuell IP 192.168.10.1, Prioritet 105, Preempt PÅ, Track g1/0/3.<br>
    <em>Detta är den aktiva routern som normalt hanterar all klienttrafik!</em>
  `);

  setupNodeClick("node-mls2", "MLS2 (Multilayer Switch)", "Standby HSRP Gateway", `
    <strong>Port Gig1/0/4:</strong> 203.0.113.6 /30 mot ISP (Routad L3-port)<br>
    <strong>Port Gig1/0/2:</strong> Accessport för VLAN 10 mot S1<br>
    <strong>Interface VLAN 10:</strong> Fysisk IP 192.168.10.3 /24<br>
    <strong>HSRP Konfiguration:</strong> Grupp 10, Virtuell IP 192.168.10.1, Prioritet 100, Preempt PÅ.<br>
    <em>Tar över omedelbart om MLS1 går ner eller om MLS1:s prioritet sjunker via tracking!</em>
  `);

  setupNodeClick("node-isp", "ISP (Internet Service Provider Switch)", "Internet Gateway", `
    <strong>Port Gig1/0/3:</strong> 203.0.113.1 /30 mot MLS1<br>
    <strong>Port Gig1/0/4:</strong> 203.0.113.5 /30 mot MLS2<br>
    <strong>Port Gig1/0/24:</strong> SERVER_NETWORK (8.8.8.8/28)<br>
    <strong>Statisk rutt:</strong> <code class="code-inline">ip route 192.168.10.0 255.255.255.0 203.0.113.2</code> (Primär)<br>
    <strong>Floating route:</strong> <code class="code-inline">ip route 192.168.10.0 255.255.255.0 203.0.113.6 5</code> (Reserv med AD 5)
  `);

  setupNodeClick("node-s1", "S1 (Layer 2 Access Switch)", "L2 Switch", `
    <strong>Port Gig0/1:</strong> Ansluten till MLS1 Gig1/0/2<br>
    <strong>Port Gig0/2:</strong> Ansluten till MLS2 Gig1/0/2<br>
    <strong>Port Fa0/1:</strong> Accessport ansluten till PC0 (Klient)<br>
    <em>Distribuerar VLAN 10 till klienterna i nätverket.</em>
  `);

  setupNodeClick("node-pc0", "PC0 (Klientdator)", "End Host", `
    <strong>IP-konfiguration:</strong> IP-adress i subnätet 192.168.10.0/24<br>
    <strong>Default Gateway:</strong> <code class="code-inline">192.168.10.1</code> (Den virtuella HSRP-adressen!)<br>
    <em>Klienten konfigureras ALDRIG med MLS1 (.2) eller MLS2 (.3) direkt, för att behålla redundansen.</em>
  `);

  setupNodeClick("node-server", "Server0", "Internet Resurs", `
    <strong>IP-nätverk:</strong> 8.8.8.8 /28 ansluten på ISP port Gig1/0/24.<br>
    <em>Simulerar internetresurs (t.ex. Google DNS).</em>
  `);
}

function setupNodeClick(nodeId, title, badge, contentHtml) {
  const node = document.getElementById(nodeId);
  if (!node) return;

  node.addEventListener("click", () => {
    sfx.playClick();
    document.getElementById("topoInfoTitle").textContent = title;
    document.getElementById("topoInfoBadge").textContent = badge;
    document.getElementById("topoInfoBody").innerHTML = contentHtml;
  });
}

// Helper: Escape HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
