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
    "id": 1,
    "category": "fhrp-intro",
    "importance": "★ VIKTIGAST TILL PROV",
    "question": "Vad står förkortningen FHRP för och vad är dess primära nätverksfunktion?",
    "options": [
      "First Hop Redundancy Protocols – erbjuder gateway-redundans så klienter inte tappar internet vid routerkrasch.",
      "Fast Host Routing Protocol – ökar överföringshastigheten mellan switchar och routrar på det lokala L2-nätverket.",
      "Forwarding Hop Redundant Path – dirigerar dynamiska rutter över internetleverantörens autonoma nätverk via BGP.",
      "Fixed Hardware Redundancy Protocol – styr reservströmförsörjning och fläktmoduler i Ciscos switch-infrastruktur."
    ],
    "correctIndex": 0,
    "explanation": "FHRP står för First Hop Redundancy Protocols. Syftet är att skapa en virtuell default gateway med redundans så att klienter behåller sin nätverksanslutning även om den primära routern fallerar.",
    "ref": "PDF Sida 1 & 3: 'Tre vanliga FHRP-protokoll / First Hop Redundancy Protocols'"
  },
  {
    "id": 2,
    "category": "fhrp-intro",
    "importance": "★ DETTA KOMMER PÅ PROV",
    "question": "Vilket av följande påståenden stämmer angående standarder för HSRP, VRRP och GLBP?",
    "options": [
      "HSRP och GLBP är proprietära Cisco-protokoll medan VRRP är en officiell öppen IETF-standard.",
      "VRRP och GLBP är öppna industristandarder medan HSRP är det enda slutna Cisco-protokollet.",
      "Samtliga tre FHRP-protokoll är öppna standarder som kan användas fritt på alla tillverkare.",
      "HSRP är en öppen standard definierad av IEEE medan VRRP och GLBP är proprietära Cisco-system."
    ],
    "correctIndex": 0,
    "explanation": "HSRP och GLBP utvecklades av Cisco och är Cisco-specifika protokoll, medan VRRP är en öppen standard från IETF.",
    "ref": "PDF Sida 3: 'HSRP cisco protokoll', 'VRRP öppen standard', 'GLBP cisco protokoll'"
  },
  {
    "id": 3,
    "category": "fhrp-intro",
    "importance": "★ ROLLER & LASTDELNING",
    "question": "Vilka roller och vilken princip för lastdelning definieras för Cisco HSRP?",
    "options": [
      "Roller: Active och Standby. Lastdelning: Endast en aktiv router per grupp hanterar all trafik.",
      "Roller: Active/Master och Backup. Lastdelning: Flera routrar hanterar datatrafiken samtidigt.",
      "Roller: AVG och AVF. Lastdelning: Flera routrar vidarebefordrar trafik via en round-robin-kö.",
      "Roller: Primary och Secondary. Lastdelning: Klienterna fördelas slumpmässigt per switchport."
    ],
    "correctIndex": 0,
    "explanation": "I HSRP finns rollerna Active och Standby (samt listen, speak, learn, initial). Endast en router är aktiv per grupp.",
    "ref": "PDF Sida 3: 'HSRP: Active standby... en aktiv router per grupp'"
  },
  {
    "id": 4,
    "category": "vrrp-glbp",
    "importance": "★ VRRP ROLLER & TRANSPORT",
    "question": "Vilka roller har VRRP och vilket protokollnummer används för transport?",
    "options": [
      "Roller: Master och Backup. VRRP skickar sina kontrollpaket direkt via IP-protokoll nummer 112.",
      "Roller: Active och Standby. VRRP skickar sina kontrollpaket inkapslade i UDP över porten 1985.",
      "Roller: AVG och AVF. VRRP skickar sina kontrollpaket via TCP över en specifik portkod 3222 här.",
      "Roller: Primary och Secondary. VRRP skickar sina kontrollpaket med ICMP typ 8 ekobegäran här."
    ],
    "correctIndex": 0,
    "explanation": "VRRP har rollerna Master och Backup och kommunicerar direkt över IP-lager med protokollnummer 112 (inte UDP/TCP!).",
    "ref": "PDF Sida 3: 'VRRP öppen standard IP-protokoll 112 master backup'"
  },
  {
    "id": 5,
    "category": "vrrp-glbp",
    "importance": "★ GLBP LASTBALANSERING",
    "question": "Vad kännetecknar GLBP gällande roller, UDP-port och vidarebefordran av trafik?",
    "options": [
      "Använder UDP 3222 med roller AVG och AVF där flera routrar kan vidarebefordra samtidigt i gruppen.",
      "Använder UDP 1985 med roller Active och Standby där endast en router vidarebefordrar datatrafiken.",
      "Använder IP-protokoll 112 med roller Master och Backup där en enda router sköter all paketrouting.",
      "Använder TCP 8080 med roller Primary och Replica där all datatrafik dupliceras över två länkpar."
    ],
    "correctIndex": 0,
    "explanation": "GLBP använder UDP-port 3222, har rollerna AVG (Active Virtual Gateway) och AVF (Active Virtual Forwarder), och erbjuder äkta lastbalansering där flera noder vidarebefordrar samtidigt.",
    "ref": "PDF Sida 3: 'GLBP cisco protokoll UDP-port 3222 AVG och AVF äkta lastbalansering flera routrar kan vidarebefordra samtidigt'"
  },
  {
    "id": 6,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: SPOF",
    "question": "Vad är en 'Single Point of Failure' (SPOF) enligt kursanteckningarna?",
    "options": [
      "En enskild komponent vars fel gör att en hel tjänst eller del av nätverket slutar fungera.",
      "En redundant switch som blockerar alternativa länkar för att förhindra skadliga nätloopar.",
      "Ett dynamiskt routingprotokoll som misslyckas med att annonsera externa rutter till grannar.",
      "En felaktigt krypterad länk mellan två routrar som orsakar paketförluster på Layer 3-nivå."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'En singel Point of failure spof är en enskild komponent vars fel gör att en tjänst eller en del av nätverket slutar fungera.'",
    "ref": "PDF Sida 1: 'Vad är en single Point failure kommer på prov?'"
  },
  {
    "id": 7,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: SPOF",
    "question": "Varför utgör en ensam router en SPOF även om switchar och länkar är redundanta?",
    "options": [
      "Om den ensamma routern dör förlorar alla lokala klienter genast kontakt med externa nätet.",
      "Switchen stänger automatiskt av alla sina fysiska portar om routern saknar redundant länk.",
      "Klienterna slutar genast att kommunicera internt på sitt eget lokala Layer 2-subnätverk.",
      "RSTP blockerar alla switchportar permanent eftersom nätet saknar en andra gateway-enhet här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'Ett nätverk kan ha redundanta switchar och länkar på lager 2 men om det bara finns en enda router konfigurerad som default gateway mot externa nät, utgör den routern en SPOF. Om denna ensamma gateway-router slutar fungera, förlorar alla lokala klienter omedelbart sin anslutning till externa nätverket.'",
    "ref": "PDF Sida 1: 'om denna ensamma gateway-router slutar fungera...'"
  },
  {
    "id": 8,
    "category": "fhrp-intro",
    "importance": "★ REDUNDANS KRÄVER PROTOKOLL",
    "question": "Varför räcker det inte med att enbart installera extra fysisk utrustning för redundans?",
    "options": [
      "Det krävs aktiva nätverksprotokoll på både Layer 2 och Layer 3 som styr trafikvägarna vid fel.",
      "Utrustningen drar för mycket ström och kräver extra kylaggregat för att undvika överhettning.",
      "Operativsystemet på klientdatorerna vägrar godkänna anslutningar med mer än en fysisk kabel.",
      "Cisco-enheter tillåter aldrig att två fysiska routrar kopplas in till samma Layer 2-switch."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'Att enbart installera extra fysisk utrustning räcker inte för att uppnå full redundans. I traditionella switchade nätverk används protokoll som RSTP... på motsvarande sätt krävs det ett protokoll för gateway-redundans på IP-nivå (lager 3).'",
    "ref": "PDF Sida 1: 'Räcker extra utrustning för redundans?'"
  },
  {
    "id": 9,
    "category": "fhrp-intro",
    "importance": "★ L2 RSTP VS L3 FHRP",
    "question": "Hur skiljer sig hanteringen av redundans mellan Layer 2 (RSTP) och Layer 3 (FHRP)?",
    "options": [
      "RSTP häver loopar och öppnar reservlänkar på L2, medan FHRP låter reservrouter ta över på L3.",
      "RSTP delar ut dynamiska IP-adresser på L2, medan FHRP krypterar all användardata på Layer 3.",
      "RSTP tilldelar unika MAC-adresser på L2, medan FHRP konfigurerar statiska DNS-servrar på L3.",
      "RSTP övervakar serverhallens brandväggar, medan FHRP enbart hanterar trådlösa accesspunkter."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: På Layer 2 används RSTP för att förhindra loopar genom att blockera redundanta vägar och öppna dem vid fel. På Layer 3 krävs FHRP så att en reservrouter omedelbart kan ta över rollen som standard-gateway.",
    "ref": "PDF Sida 1: 'RSTP för att förhindra loopar... protokoll för gateway-redundans på IP-nivå (lager 3)'"
  },
  {
    "id": 10,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: FIRST HOP",
    "question": "Vad menas med begreppet 'det första hoppet' (First Hop) enligt provfrågan?",
    "options": [
      "Den allra första Layer 3-enheten som ett IP-paket passerar på väg ut från det lokala nätet.",
      "Den första Layer 2-switchen som tar emot Ethernet-ramen från klientens lokala nätverkskort.",
      "Den första brandväggen hos internetleverantören som filtrerar inkommande och utgående paket.",
      "Den lokala DHCP-server som tilldelar klienten dess subnätmask och primära IP-inställning."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: 'Det första hoppet (first hop) definieras som den allra första L3-enheten (en router eller en L3-switch) som ett IP-paket passerar på sin väg utanför det lokala nätverket. För en vanlig klientdator eller server innebär detta hoppet till dess konfigurerade default gateway.'",
    "ref": "PDF Sida 2: 'Vad menas med det första hoppet rubrik'"
  },
  {
    "id": 11,
    "category": "fhrp-intro",
    "importance": "★ L2-SWITCH EJ FIRST HOP",
    "question": "Varför räknas en vanlig Layer 2-switch INTE som det första hoppet för IP-paketet?",
    "options": [
      "En L2-switch vidarebefordrar bara Ethernet-ramar och läser inte IP-adresser på nätverkslagret.",
      "En L2-switch har ingen strömförsörjning och kan inte bearbeta datapaket i realtid på nätet.",
      "En L2-switch blockerar alltid paket som försöker skickas till destinationer utanför LAN:et.",
      "En L2-switch saknar helt fysiska MAC-adresser och kan därför inte ingå i paketförmedlingen."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: Första hoppet är en L3-enhet (router/L3-switch). En vanlig L2-switch arbetar uteslutande på datalänklagret (Layer 2) och dirigerar ramar baserat på MAC-adresser, inte IP-adresser.",
    "ref": "PDF Sida 2: 'det första hoppet definieras som den allra första L3-enheten... en vanlig L2-switch'"
  },
  {
    "id": 12,
    "category": "fhrp-intro",
    "importance": "★ STATISK GATEWAY RISK",
    "question": "Vad är problemet om en klient har en statiskt inställd router-IP som default gateway?",
    "options": [
      "Klienten blir bunden till den routern och kan inte själv byta till reserven om den dör.",
      "Klienten kommer automatiskt att radera sitt operativsystem om nätverkskabeln kopplas ur.",
      "Klientens nätverkskort överbelastas av broadcast-paket och kraschar inom några sekunder.",
      "Switchen förväxlar klientens MAC-adress med routern och stänger av porten via port-lås."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: 'Om en klient är statiskt inställd på att använda en specifik routers IP-adress som gateway, blir den helt beroende av den specifika enheten. Klienten kan inte på egen hand växla över till en annan tillgänglig router om den primära slutar fungera.'",
    "ref": "PDF Sida 2: 'om en klient är statisk inställd...'"
  },
  {
    "id": 13,
    "category": "hsrp-core",
    "importance": "★ GEMENSAM VIRTUELL GATEWAY",
    "question": "Hur löser HSRP problemet med gateway-beroende för klienterna på det lokala nätet?",
    "options": [
      "Flera fysiska routrar samverkar och agerar som en enda gemensam virtuell router med delad VIP.",
      "Klienten kör ett eget routingprotokoll som byter default gateway varje gång en ping förloras.",
      "Switchen tilldelar automatiskt två helt separata default gateways till varje enskild klient.",
      "DNS-servern uppdaterar klientens gateway-adress var tionde sekund via dynamiska SRV-poster."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4: 'Med HSRP kan två eller flera fysiska routrar gå samman och presentera sig som en enda gemensam virtuell router för klienterna på nätverket. Den virtuella routern tilldelas en unik virtuell IP-adress (VIP) samt en matchande virtuell MAC-adress (VMAC).'",
    "ref": "PDF Sida 4: 'HSRP - en gemensam virtuell gateway'"
  },
  {
    "id": 14,
    "category": "hsrp-core",
    "importance": "★ EGNA VS VIRTELLA IP",
    "question": "Vad gäller för routrarnas egna fysiska IP-adresser i en konfigurerad HSRP-grupp?",
    "options": [
      "Varje router behåller sin unika fasta fysiska IP-adress på interfacet utöver den delade VIP:n.",
      "Routrarnas fysiska IP-adresser raderas helt och ersätts uteslutande av den virtuella adressen.",
      "Alla routrar i gruppen tvingas konfigurera exakt samma fysiska IP-adress på sina interface.",
      "Fysiska IP-adresser ersätts av privata MAC-adresser som genereras slumpmässigt vid omstart."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4: 'Egna och virtuella IP-adresser i HSRP: varje L3-switch eller router i en HSRP-grupp behåller sin unika, fasta IP-adress på sitt interface (t.ex. R1 har 10.1.1.2 och R2 har 10.1.1.3).'",
    "ref": "PDF Sida 4: 'egna och virtuella ip addresser i hsrp'"
  },
  {
    "id": 15,
    "category": "hsrp-core",
    "importance": "★ FORMAT PÅ VMAC",
    "question": "Vilket format har den virtuella MAC-adressen i HSRPv1 och HSRPv2 för IPv4?",
    "options": [
      "HSRPv1 använder formatet 0000.0c07.acXX och HSRPv2 för IPv4 använder 0000.0c9f.fXXX i nätet.",
      "HSRPv1 använder formatet 0000.0c9f.fXXX och HSRPv2 för IPv4 använder 0000.0c07.acXX i nätet.",
      "HSRPv1 använder formatet 0000.5e00.01XX och HSRPv2 för IPv4 använder 0007.0c01.acXX i nätet.",
      "HSRPv1 använder formatet ffff.0c07.acXX och HSRPv2 för IPv4 använder 0000.ffff.fXXX i nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5 & 8: 'HSRPv1 använder formatet 0000.0c07.acXX. HSRPv2 för IPv4 använder formatet 0000.0c9f.fXXX. XX eller XXX är gruppnumret uttryckt i hexadecimal form.'",
    "ref": "PDF Sida 5: 'Den virtuella mac-addressen' & Sida 8"
  },
  {
    "id": 16,
    "category": "mac-calc",
    "importance": "★ PROVEXEMPEL: GRUPP 150",
    "question": "Vilken virtuell MAC-adress skapas i HSRPv1 för grupp 150 (beräkna 150 i hex)?",
    "options": [
      "0000.0c07.ac96 (eftersom 150 delat med 16 ger kvoten 9 och resten 6, vilket bildar talet 96).",
      "0000.0c07.ac0a (eftersom 150 delat med 16 ger kvoten 10 och resten 0, vilket bildar koden 0A).",
      "0000.0c07.acff (eftersom 150 delat med 16 ger kvoten 15 och resten 15, vilket bildar koden FF).",
      "0000.0c9f.f150 (eftersom gruppnumret 150 alltid skrivs ut i decimal form utan omvandling här)."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Group 150: 150/16 = 9 och rest 6, då kommer vi ha 9 och 6, MAC-adressen blir 0000.0c07.AC96.'",
    "ref": "PDF Sida 5: 'Group 150: 150/16 = 9 och rest 6... 0000.0c07.AC96'"
  },
  {
    "id": 17,
    "category": "mac-calc",
    "importance": "★ PROVEXEMPEL: GRUPP 255 & 10",
    "question": "Vilka virtuella MAC-adresser skapas i HSRPv1 för grupp 10 respektive grupp 255?",
    "options": [
      "Grupp 10 ger 0000.0c07.ac0a och grupp 255 ger 0000.0c07.acff (10 är 0A och 255 är FF i hex).",
      "Grupp 10 ger 0000.0c07.ac10 och grupp 255 ger 0000.0c07.ac99 (10 är 10 och 255 är 99 i hex).",
      "Grupp 10 ger 0000.0c9f.f010 och grupp 255 ger 0000.0c9f.ffff (10 är 10 och 255 är FF i hex).",
      "Grupp 10 ger 0000.5e00.010a och grupp 255 ger 0000.5e00.01ff (10 är 0A och 255 är FF i hex)."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Grupp 10 blir 0A: HSRPv1 använder 0000.0c07.ac0a. Grupp 255: 255/16 = 15 rest 15 -> 0000.0c07.ACFF.'",
    "ref": "PDF Sida 5: 'grupp 10 blir 0A... grupp 255 255/16 = 15 rest 15 0000.0C07.ACFF'"
  },
  {
    "id": 18,
    "category": "mac-calc",
    "importance": "★ OFÖRÄNDRAD VMAC VID FEL",
    "question": "Vad gäller för den virtuella MAC-adressen när standby-routern tar över rollen som Active?",
    "options": [
      "Den virtuella MAC-adressen är densamma så klienterna slipper uppdatera sina ARP-tabeller.",
      "Den virtuella MAC-adressen byts direkt ut mot reservrouterns unika fysiska hårdvaruadress.",
      "Den virtuella MAC-adressen raderas och alla klienter måste starta om sina nätverkskort.",
      "Den virtuella MAC-adressen omvandlas till en broadcast-adress under en minut vid växling."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Den virtuella MAC-adressen är densamma även när en router tar över i Active.' Detta gör failover helt transparent för klienterna!",
    "ref": "PDF Sida 5: 'den virtuella mac-addressen är densamma även när en router tar över i Active'"
  },
  {
    "id": 19,
    "category": "mac-calc",
    "importance": "★ ARP OCH GATEWAY",
    "question": "Vad händer när en dator gör ARP-förfrågan ('vem har 192.168.1.1?') i en HSRP-grupp?",
    "options": [
      "HSRP:s Active router svarar med gruppens virtuella MAC-adress (t.ex. 0000.0c07.ac96).",
      "Både Active och Standby svarar samtidigt med sina respektive fysiska port-MAC-adresser.",
      "Standby-routern svarar med VIP medan den aktiva routern förblir tyst för att spara CPU.",
      "Access-switchen svarar med sin egen loopback-MAC för att avlasta båda Layer 3-routrarna."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 6: 'När en dator ska skicka trafik till sin default gateway gör den ARP: vem har 192.168.1.1? HSRP:s Active router svarar med HSRP-gruppens virtuella MAC-adress (0000.0c07.ac96).'",
    "ref": "PDF Sida 6: 'vem har 192.168.1.1? HSRP:S Active router svarar med hsrp-gruppens virtuella mac-address'"
  },
  {
    "id": 20,
    "category": "mac-calc",
    "importance": "★ KOMMER PÅ PROV: ARP -A",
    "question": "Vad visas i Windows-kommandotolken via 'arp -a' för default gateway i ett HSRP-nätverk?",
    "options": [
      "Den virtuella IP-adressen (VIP) visas dynamiskt bunden till gruppens virtuella MAC-adress.",
      "Den fysiska routerns serienummer visas dynamiskt kopplat till switchportens VLAN-nummer.",
      "Internetleverantörens publika IP-adress visas dynamiskt kopplad till klientens eget kort.",
      "Gateway-adressen visas helt tom i listan eftersom HSRP döljer alla lokala ARP-tabeller."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'C:/Users/gonriv> arp -a ... 10.1.1.1 00-00-0c-07-ac-01 dynamic'. Gatewayens IP kopplas dynamiskt till HSRP:s virtuella MAC.",
    "ref": "PDF Sida 7: 'arp -a / 10.1.1.1 00-00-0c-07-ac-01 dynamic'"
  },
  {
    "id": 21,
    "category": "mac-calc",
    "importance": "★ DESTINATIONS-IP INTRAKT",
    "question": "Hur adresseras Ethernet-ramen och IP-paketet när en klient skickar data ut på internet?",
    "options": [
      "Ethernet-ramen skickas till gatewayens VMAC medan IP-paketets destinations-IP är slutservern.",
      "Både Ethernet-ramen och IP-paketet adresseras direkt till den aktiva routerns fysiska port.",
      "Ethernet-ramen adresseras till broadcast (FFFF) medan destinations-IP sätts till noll i ramen.",
      "Ethernet-ramen skickas till klientens egen MAC medan destinations-IP sätts till VIP på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'Klienten skickar Ethernet-ramen till den virtuella MAC-adressen. Paketets destinations-IP är fortfarande den slutliga mottagarens IP-adress. Den aktiva routern använder sin routingtabell för att vidarebefordra paketet.'",
    "ref": "PDF Sida 7: 'paketets destinations-ip är fortfarande den slutliga mottagarens ip-address'"
  },
  {
    "id": 22,
    "category": "hsrp-core",
    "importance": "★ STANDBY TAR EJ TRAFIK",
    "question": "Hur agerar Standby-routern när klienter skickar vanlig datatrafik till gatewayens VIP?",
    "options": [
      "Standby-routern tar inte emot eller vidarebefordrar denna trafik, utan övervakar Active.",
      "Standby-routern vidarebefordrar exakt hälften av alla TCP-sessioner via sin egen upplänk.",
      "Standby-routern lagrar all klienttrafik i en intern kö tills Active bekräftar mottagning.",
      "Standby-routern skickar tillbaka ICMP Redirect till klienten och stänger ner interfacet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'Standby server tar inte emot denna typ av trafik.' All klienttrafik hanteras uteslutande av den aktiva routern.",
    "ref": "PDF Sida 7: 'standby server tar inte emot denna typ av trafik'"
  },
  {
    "id": 23,
    "category": "hsrp-core",
    "importance": "★ HSRPV1 VS HSRPV2",
    "question": "Vilka gruppnummer och multicast-adresser skiljer HSRPv1 från HSRPv2 för IPv4?",
    "options": [
      "v1 stödjer grupper 0-255 med IP 224.0.0.2; v2 stödjer grupper 0-4095 med IP 224.0.0.102.",
      "v1 stödjer grupper 0-4095 med IP 224.0.0.102; v2 stödjer grupper 0-255 med IP 224.0.0.2.",
      "v1 stödjer grupper 1-100 med IP 224.0.0.18; v2 stödjer grupper 1-1000 med IP 224.0.0.9.",
      "Båda versionerna stödjer 65535 grupper och skickar broadcast (255.255.255.255) på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 8: 'HSRPv1: stöder gruppnummer 0-255, multicast 224.0.0.2. HSRPv2: stöder gruppnummer 0-4095 (täcker hela VLAN-intervallet), multicast 224.0.102.'",
    "ref": "PDF Sida 8: 'HSRP version 1 kontra version 2'"
  },
  {
    "id": 24,
    "category": "hsrp-core",
    "importance": "★ HSRPV2 IPV6 & TIMERS",
    "question": "Vilka ytterligare förbättringar erbjuder HSRPv2 utöver fler grupper enligt anteckningarna?",
    "options": [
      "Inbyggt stöd för timers i millisekunder samt IPv6-redundans med FF02::66 och UDP 2029.",
      "Automatisk konfiguration utan IP-adressering samt integrerad brandvägg på Layer 2-nivå.",
      "Ersättning av alla Cisco CLI-kommandon med ett webbaserat gränssnitt via HTTPS-port 443.",
      "Kompression av datapaket med 50% samt full bakåtkompatibilitet med AppleTalk-protokoll."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 8: 'HSRPv2 har inbyggt stöd för timers i millisekunder. Stöder IPv6-redundans med multicast-adressen FF02::66 och UDP-port 2029.'",
    "ref": "PDF Sida 8: 'har inbyggt stöd för timers i millisekunder. stöder ipv6-redundans...'"
  },
  {
    "id": 25,
    "category": "hsrp-states",
    "importance": "★ 6 TILLSTÅND TILL PROV",
    "question": "Vilka är HSRP:s 6 tillstånd i exakt rätt kronologisk ordningsföljd?",
    "options": [
      "Initial ➔ Learn ➔ Listen ➔ Speak ➔ Standby ➔ Active i en obruten sekventiell följd.",
      "Initial ➔ Listen ➔ Learn ➔ Speak ➔ Active ➔ Standby i en obruten sekventiell följd.",
      "Learn ➔ Listen ➔ Speak ➔ Standby ➔ Active ➔ Initial i en obruten sekventiell följd.",
      "Initial ➔ Speak ➔ Listen ➔ Learn ➔ Standby ➔ Active i en obruten sekventiell följd."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: De 6 tillstånden är: Initial, Learn, Listen, Speak, Standby, Active.",
    "ref": "PDF Sida 9 & 10: 'HSRP 6 tillstånd states'"
  },
  {
    "id": 26,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: INITIAL & LEARN",
    "question": "Vad innebär tillståndet 'Initial' respektive 'Learn' enligt provanteckningarna?",
    "options": [
      "Initial: HSRP har ej startat; Learn: väntar på hello för att lära sig virtuell IP-adress.",
      "Initial: routern skickar ARP; Learn: routern sparar konfigurationen permanent i NVRAM.",
      "Initial: routern vidarebefordrar data; Learn: routern lyssnar passivt på klienters DNS.",
      "Initial: interfacet är nere; Learn: routern utser omedelbart sig själv till Active-nod."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: 'Initial: utgångsläget där HSRP ännu inte har startat eller interfacet precis har kommit upp. Learn: enheten väntar på att ta emot hello-paket från den aktiva routern för att lära sig den virtuella IP-adressen om den inte är statiskt satt.'",
    "ref": "PDF Sida 9: 'Inital... Leearn...'"
  },
  {
    "id": 27,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: LISTEN & SPEAK",
    "question": "Vad innebär tillståndet 'Listen' respektive 'Speak' enligt provanteckningarna?",
    "options": [
      "Listen: känner till VIP och lyssnar passivt; Speak: börjar aktivt skicka egna hello-paket.",
      "Listen: skickar aktiva hellos; Speak: lyssnar passivt på routingtabeller från ISP-routern.",
      "Listen: vidarebefordrar hälften av paketen; Speak: tar över ansvaret för all klienttrafik.",
      "Listen: stänger av gränssnittet vid fel; Speak: loggar alla tillståndsändringar via syslog."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: 'Listen: enheten känner till den virtuella IP-adressen men är varken Active eller Standby. Den lyssnar passivt på hello-meddelanden från de andra. Speak: enheten börjar aktivt skicka ut egna hello-meddelanden och deltar i valprocessen.'",
    "ref": "PDF Sida 9: 'Listen... Speak...'"
  },
  {
    "id": 28,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: STANDBY & ACTIVE",
    "question": "Hur definieras rollerna 'Standby' och 'Active' under HSRP-processens sista tillstånd?",
    "options": [
      "Standby: vald reserv som övervakar Active; Active: enhet som tagit på sig ledarrollen.",
      "Standby: hanterar IPv6-trafik; Active: hanterar IPv4-trafik uteslutande på gränssnittet.",
      "Standby: vidarebefordrar alla paket; Active: agerar backup om standby-enheten kraschar.",
      "Standby: blockerar alla portar; Active: utför dynamisk routning mot externa system här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Standby: enheten har valts till reserv. Den övervakar kontinuerligt den aktiva routern och är redo att ta över när den aktiva routern bedöms vara otillgänglig. Active: enheten har tagit på sig ledarrollen.'",
    "ref": "PDF Sida 10: 'hsrp 6 tillstånd states- standby och Active'"
  },
  {
    "id": 29,
    "category": "hsrp-core",
    "importance": "★ PRIORITET INTERVALL & DEFAULT",
    "question": "Vilket intervall kan HSRP-prioritet konfigureras med och vad är standardvärdet?",
    "options": [
      "Prioritet konfigureras mellan 0 och 255 och standardvärdet på ett gränssnitt är 100.",
      "Prioritet konfigureras mellan 1 och 100 och standardvärdet på ett gränssnitt är 500.",
      "Prioritet konfigureras mellan 0 och 4095 och standardvärdet på ett gränssnitt är 100.",
      "Prioritet konfigureras mellan 1 och 65535 och standardvärdet på ett gränssnitt är 10."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Ett HSRP-interface kan konfigureras med en prioritet mellan 0 och 255. Standardvärdet är 100. Vid val av roll Active vinner interfacet med högsta prioritet.'",
    "ref": "PDF Sida 10: 'HSRP-prioritet och preemption'"
  },
  {
    "id": 30,
    "category": "hsrp-core",
    "importance": "★ TIE-BREAKER VID SAMMA PRIO",
    "question": "R1 (10.1.1.2) och R2 (10.1.1.3) har båda prioritet 100. Vem blir Active och varför?",
    "options": [
      "R2 vinner eftersom R2 har den högsta fysiska IP-adressen (10.1.1.3 är högre än 10.1.1.2).",
      "R1 vinner eftersom R1 har den lägsta fysiska IP-adressen (10.1.1.2 är lägre än 10.1.1.3).",
      "Ingen vinner utan routern som har lägst MAC-adress utses automatiskt till aktiv router.",
      "Båda routrarna blir Active samtidigt och delar upp alla klienter 50/50 via round-robin."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Om två enheter har samma prioritet blir den enhet som har högsta fysisk IP-adress Active. r1 10.1.1.2, r2 10.1.1.3 -> R2 vinner.'",
    "ref": "PDF Sida 10: 'om två enheter har samma prioritet blir den enhet som har högsta fysisk ip address Active'"
  },
  {
    "id": 31,
    "category": "hsrp-core",
    "importance": "★ FAILOVER & OMSTART UTAN PREEMPT",
    "question": "Vad händer när den tidigare aktiva routern startar om ifall 'preempt' INTE är aktiverat?",
    "options": [
      "Den tar INTE tillbaka Active-rollen automatiskt, även om den har högre prioritet i gruppen.",
      "Den tar OMEDELBART tillbaka rollen som Active så fort dess första hello-paket skickas ut.",
      "Den stänger av sitt gränssnitt helt på grund av en konflikt med den aktiva routern på LAN.",
      "Den tvingar den andra routern att starta om för att nollställa hela valprocessen på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Vad händer när den tidigare aktiva routern startar igen? Tar den tillbaka Active? Nej, även om den har högre prioritet! Med standby preempt aktiverat på routern med högre prioritet kan den ta tillbaka rollen som Active.'",
    "ref": "PDF Sida 11: 'Vad händer om den aktiva routern slutar fungera'"
  },
  {
    "id": 32,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: TIMER-REGEL",
    "question": "Vad är standardvärdena för HSRP timers och vilken formel måste du kunna på provet?",
    "options": [
      "Hello är 3s och Hold är 10s; Hold-timern bör vara minst tre gånger så stor som Hello i nätet.",
      "Hello är 10s och Hold är 3s; Hello-timern bör vara minst tre gånger så stor som Hold i nätet.",
      "Hello är 1s och Hold är 2s; Hold-timern måste alltid vara exakt dubbelt så stor som Hello här.",
      "Hello är 5s och Hold är 5s; båda parametrarna måste alltid vara exakt identiska i sekunder här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Hello-timern är normalt 3 sekunder... Hold-timern är normalt 10 sekunder... Den blir cirka 3 gånger större än hello-timern (3*3+1=10) kommer på prov du måste kunna räkna ut. Hold-timern bör vara minst tre gånger hello-timern.'",
    "ref": "PDF Sida 11: 'hsrp timers och anpassning av omkopplingstid / minst tre gånger hello'"
  },
  {
    "id": 33,
    "category": "hsrp-core",
    "importance": "★ VARFÖR HOLD 3X HELLO",
    "question": "Varför bör Hold-timern i HSRP alltid konfigureras till minst tre gånger Hello-timern?",
    "options": [
      "Det minskar risken för onödiga rollbyten vid hög nätverksbelastning eller tappade paket.",
      "Det säkerställer att switchens STP-konvergens inte blockerar portar på access-nivån här.",
      "Det är ett krav från IEEE för att tillåta routning av multicast-trafik över Ethernet.",
      "Det förhindrar att klientdatorernas operativsystem kraschar vid snabba failover-byten."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Hold-timern bör vara minst tre gånger hello-timern. Det minskar risken för onödiga rollbyten vid hög belastning eller förlorade meddelanden.'",
    "ref": "PDF Sida 11: 'det minskar risken för onödiga rollbyten vid hög belastning'"
  },
  {
    "id": 34,
    "category": "hsrp-core",
    "importance": "★ SNABBARE TIMERS",
    "question": "Hur kan HSRP-timers anpassas för snabbare failover enligt anteckningarnas exempel?",
    "options": [
      "Genom att konfigurera kortare timers som t.ex. Hello 1 sekund och Hold 3 sekunder på porten.",
      "Genom att stänga av Hello-meddelanden helt och hållet och enbart förlita sig på ARP i LAN:et.",
      "Genom att konfigurera Hello till 10 sekunder och Hold-timern till 30 sekunder på interfacet.",
      "Genom att öka nätverkskabelns klockfrekvens från 100 MHz till 1000 MHz i switch-hårdvaran."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Kortare timers ger snabbare övertagande, exempelvis hello 1 sekund och hold 3 sekunder.'",
    "ref": "PDF Sida 11: 'kortare timers ger snabbare övertagande, exempelvis hello 1 sekund och hold 3 sekunder'"
  },
  {
    "id": 35,
    "category": "topology-cli",
    "importance": "★ INTERFACE TRACKING",
    "question": "Vad är huvudsyftet med interface tracking i HSRP enligt kursanteckningarna?",
    "options": [
      "Att övervaka routerns uplink mot ISP och sänka prioriteten vid fel för att undvika black holes.",
      "Att logga samtliga användares webbhistorik till en central syslog-server hos administratören.",
      "Att mäta kabeldämpning på switchporten och varna om överföringshastigheten sjunker under 1G.",
      "Att blockera obehöriga MAC-adresser från att ansluta till nätverket via IEEE 802.1X-kontroll."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: 'Interface tracking - skydd mot brutna uplinks (black holes): genom att konfigurera interface tracking kan HSRP-processen instrueras att kontinuerligt övervaka statusen på routerns uplink.' Om uplänken dör sänks prioriteten så att standby kan ta över med preemption.",
    "ref": "PDF Sida 12: 'interface tracing-skydd mot brutna uplinks (black holes)'"
  },
  {
    "id": 36,
    "category": "topology-cli",
    "importance": "★ TRACKING BEGRÄNSNING",
    "question": "Vad är en begränsning med grundläggande interface tracking enligt anteckningarna?",
    "options": [
      "Den upptäcker bara om det lokala gränssnittet går ner; fel längre bort kräver annan koll.",
      "Den fungerar uteslutande på trådlösa gränssnitt och stöds inte på vanliga Gigabit-länkar.",
      "Den kan inte kombineras med kommandot standby preempt utan kräver manuell omstart här.",
      "Den sänker routerns prioritet till noll och gör att routern aldrig kan bli aktiv igen här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: 'Interface-övervakningen upptäcker att det övervakade interfacet går ner. Ett fel längre bort i nätverket kan kräva annan övervakning (t.ex. IP SLA object tracking).'",
    "ref": "PDF Sida 12: 'ett fel längre bort i nätverket kan kräva annan övervakning'"
  },
  {
    "id": 37,
    "category": "hsrp-core",
    "importance": "★ UDP-PORT HSRP",
    "question": "Vilken specifik UDP-port används av HSRP för att skicka sina hello-meddelanden?",
    "options": [
      "UDP-port 1985 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 520 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 67 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 3222 används av HSRP för att kommunicera hello-meddelanden mellan routrarna."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 3: HSRP skickar kontrollpaket över UDP på port 1985.",
    "ref": "PDF Sida 3: 'HSRP cisco protokoll UDP PORT 1985'"
  },
  {
    "id": 38,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: VMAC V2",
    "question": "Vilken virtuell MAC-adress används för HSRP version 2 (HSRPv2) i grupp 1?",
    "options": [
      "0000.0c9f.f001 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0000.0c07.ac01 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0000.5e00.0101 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0007.0c9f.ffff används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket."
    ],
    "correctIndex": 0,
    "explanation": "I HSRPv2 har den virtuella MAC-adressen formatet 0000.0c9f.fXXX där de tre sista siffrorna är gruppnumret i hex. Grupp 1 har alltså 0000.0c9f.f001! (HSRPv1 använde 0000.0c07.acXX).",
    "ref": "PDF Sida 5 & 8: 'HSRPv2 för ipv4 använder formatet 0000.0c9f.fXXX'"
  },
  {
    "id": 39,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: PREEMPT",
    "question": "Vad gör kommandot 'standby <grupp> preempt' på ett HSRP-gränssnitt?",
    "options": [
      "Låter routern ta över som Active om dess prioritet är högre än nuvarande aktiv router.",
      "Tvingar routern att stänga ner sitt gränssnitt om en annan router upptäcks på nätverket.",
      "Raderar all HSRP-konfiguration från routerns minne om ett länkavbrott inträffar lokalt.",
      "Förhindrar andra routrar från att överhuvudtaget kommunicera på samma Layer 2-VLAN här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: Preemption jämför prioritet och tillåter en router med högre prioritet att ta tillbaka ledarrollen som Active.",
    "ref": "PDF Sida 11: 'med standby preempt aktiverat på routern med högre prioritet kan den ta tillbaka rollen som Active'"
  },
  {
    "id": 40,
    "category": "vrrp-glbp",
    "importance": "★ DETTA KOMMER PÅ PROV",
    "question": "Vilken standardprioritet har VRRP och vilken prioritet har adressägaren (IP owner)?",
    "options": [
      "Standardprioritet är 100 och adressägaren (IP owner) har alltid högsta prioritet 255.",
      "Standardprioritet är 1 och adressägaren (IP owner) har alltid standardprioriteten 100.",
      "Standardprioritet är 255 och adressägaren (IP owner) har alltid lägsta prioriteten 0.",
      "VRRP saknar helt prioritetsfält och lottar ut ledarrollen slumpmässigt vid uppstart."
    ],
    "correctIndex": 0,
    "explanation": "I VRRP är standardprioriteten 100, medan routern som äger den faktiska IP-adressen har prioritet 255.",
    "ref": "Anteckningar & Provguide: VRRP standardprioritet 100, adressägare 255"
  },
  {
    "id": 41,
    "category": "vrrp-glbp",
    "importance": "★ GLBP ROLLER",
    "question": "Vad är den specifika uppgiften för en AVG (Active Virtual Gateway) i GLBP?",
    "options": [
      "Den svarar på klienters ARP-förfrågningar och delar ut olika virtuella MAC-adresser.",
      "Den stänger ner switchportar som överbelastas med hjälp av spanning-tree protokoll.",
      "Den krypterar samtlig användardata mellan klienten och routern via en IPsec-tunnel.",
      "Den agerar uteslutande standby-reserv och vidarebefordrar aldrig några datapaket alls."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 3: AVG svarar på klienternas ARP-förfrågningar och fördelar trafiken till AVF:er.",
    "ref": "PDF Sida 3: 'AVG (Active virtual gateway) och AVF'"
  },
  {
    "id": 42,
    "category": "vrrp-glbp",
    "importance": "★ GLBP METOD",
    "question": "Vilken standardmetod används av GLBP för att dela ut MAC-adresser till klienter?",
    "options": [
      "Round-robin används som standardmetod för att dela ut MAC-adresser i strikt turordning.",
      "Host-dependent används som standardmetod för att binda varje klient permanent vid IP.",
      "Weighted random används som standardmetod baserat på aktuell processorbelastning i CPU.",
      "First come first served används som standardmetod utan återanvändning av MAC-adresser."
    ],
    "correctIndex": 0,
    "explanation": "Standardmetoden i GLBP är Round-robin, där MAC-adresser delas ut i turordning.",
    "ref": "Anteckningar & Provguide: GLBP Round-robin"
  },
  {
    "id": 43,
    "category": "topology-cli",
    "importance": "★ GLOBAL ROUTING",
    "question": "Vilket globalt kommando måste ALLTID köras på en Cisco L3-switch för att den ska routa?",
    "options": [
      "ip routing måste alltid köras i globalt konfigurationsläge för att aktivera IP-routing.",
      "router rip måste alltid köras i globalt konfigurationsläge för att aktivera IP-routing.",
      "routing enable måste köras i globalt konfigurationsläge för att aktivera IP-routing här.",
      "ip forward-protocol måste köras i globalt konfigurationsläge för att aktivera IP-routing."
    ],
    "correctIndex": 0,
    "explanation": "Cisco Layer 3-switchar kräver 'ip routing' i global configuration mode för att aktivera IP-routing.",
    "ref": "Lab-konfiguration: 'MLS1(config)#ip routing'"
  },
  {
    "id": 44,
    "category": "topology-cli",
    "importance": "★ ROUTAD L3 PORT",
    "question": "Hur konverterar man en fysisk switchport (t.ex. g1/0/3) till ett routat L3-gränssnitt?",
    "options": [
      "no switchport körs under interfacet för att ta bort L2 och göra porten till en L3-port.",
      "switchport mode routed körs under interfacet för att ta bort L2 och göra porten till L3.",
      "ip routed-interface körs under interfacet för att ta bort L2 och göra porten till L3.",
      "routing port enable körs under interfacet för att ta bort L2 och göra porten till L3."
    ],
    "correctIndex": 0,
    "explanation": "Kommandot 'no switchport' tar bort Layer 2-egenskaperna och möjliggör tilldelning av en IP-adress direkt på porten.",
    "ref": "Lab-konfiguration: 'ISP(config-if)#no switchport'"
  },
  {
    "id": 45,
    "category": "topology-cli",
    "importance": "★ INTERFACE TRACKING SYNTAX",
    "question": "Vad gör kommandot 'standby 10 track g1/0/3' på MLS1 i labbkonfigurationen?",
    "options": [
      "Om uplänken g1/0/3 går ner sänks MLS1:s prioritet så att MLS2 kan ta över som Active.",
      "Det speglar all inkommande trafik på port g1/0/3 till en nätverksanalysator via SPAN.",
      "Det stänger av HSRP permanent på interfacet om port g1/0/3 råkar flappa tre gånger.",
      "Det krypterar alla datapaket som skickas över länken g1/0/3 mot internetleverantören."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: Interface tracking övervakar upplänken g1/0/3 och sänker HSRP-prioriteten vid länkbrott.",
    "ref": "Lab-konfiguration & PDF Sida 12: 'standby 10 track g1/0/3'"
  },
  {
    "id": 46,
    "category": "topology-cli",
    "importance": "★ FLOATING ROUTE",
    "question": "Varför slutar kommandot 'ip route 192.168.10.0 255.255.255.0 203.0.113.6 5' med siffran 5?",
    "options": [
      "Siffran 5 sätter administrativ distans (AD) till 5 och skapar en floating static backup.",
      "Siffran 5 anger hur många sekunder routern ska vänta innan paketet sänds över nätverket.",
      "Siffran 5 anger att rutten endast gäller för maximalt fem anslutna lokala klientdatorer.",
      "Siffran 5 kopplar rutten direkt till HSRP-grupp nummer fem i routerns interna minnestyp."
    ],
    "correctIndex": 0,
    "explanation": "Siffran 5 definierar en administrativ distans (AD) högre än standard (1), vilket skapar en floating static route.",
    "ref": "Lab-konfiguration: 'ip route 192.168.10.0 255.255.255.0 203.0.113.6 5'"
  },
  {
    "id": 47,
    "category": "topology-cli",
    "importance": "★ VERSION 2 KOMMANDO",
    "question": "Vilket kommando aktiverar HSRP version 2 under ett VLAN-gränssnitt i Cisco IOS?",
    "options": [
      "standby version 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "hsrp version 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "standby v2 enable körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "version hsrp 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen."
    ],
    "correctIndex": 0,
    "explanation": "Cisco IOS-syntax under gränssnittet är: 'standby version 2'.",
    "ref": "Lab-konfiguration: 'MLS1(config-if)#standby version 2'"
  },
  {
    "id": 48,
    "category": "topology-cli",
    "importance": "★ ACCESS PORT KONFIG",
    "question": "Hur konfigureras porten g1/0/2 på MLS1 som ansluter till access-switchen S1?",
    "options": [
      "switchport mode access följt av switchport access vlan 10 direkt under interfacet.",
      "switchport mode trunk följt av switchport trunk allowed vlan 10 direkt på switchport.",
      "no switchport följt av kommandot ip address 192.168.10.2 direkt under gränssnittet.",
      "standby 10 vlan access följt av ip default-gateway direkt under switchkonfiguration."
    ],
    "correctIndex": 0,
    "explanation": "Porten mot Layer 2-switchen S1 konfigureras med 'switchport mode access' och 'switchport access vlan 10'.",
    "ref": "Lab-konfiguration: 'MLS1(config-if)#switchport mode access'"
  },
  {
    "id": 49,
    "category": "topology-cli",
    "importance": "★ DEFAULT ROUTE",
    "question": "Vilket kommando konfigurerar en default route på MLS1 mot ISP:s port (203.0.113.1)?",
    "options": [
      "ip route 0.0.0.0 0.0.0.0 203.0.113.1 konfigurerar standardrutten i globalt läge.",
      "ip default-gateway 203.0.113.1 konfigurerar standardrutten i det globala läget.",
      "ip route default 203.0.113.1 konfigurerar standardrutten i detta globala läge.",
      "standby route 0.0.0.0 203.0.113.1 konfigurerar standardrutten i ett globalt läge."
    ],
    "correctIndex": 0,
    "explanation": "På en enhet med routing aktiverad är syntaxen: 'ip route 0.0.0.0 0.0.0.0 <next-hop>'.",
    "ref": "Lab-konfiguration: 'MLS1(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.1'"
  },
  {
    "id": 50,
    "category": "topology-cli",
    "importance": "★ SPARA KONFIGURATION",
    "question": "Vilket kommando körs i privileged EXEC mode för att spara den aktiva konfigurationen?",
    "options": [
      "copy running-config startup-config (eller write memory) sparar ändringar i NVRAM.",
      "save config running (eller kommandot store config) sparar ändringar direkt i NVRAM.",
      "store startup-config (eller kommandot flash write) sparar ändringar direkt i NVRAM.",
      "nvram write running (eller kommandot sync config) sparar ändringar direkt i NVRAM."
    ],
    "correctIndex": 0,
    "explanation": "Kommandot är 'copy running-config startup-config' (eller 'write memory' / 'wr').",
    "ref": "Lab-konfiguration: 'ISP#copy running-config startup-config'"
  },
  {
    "id": 51,
    "category": "topology-cli",
    "importance": "★ PROVLABB GRUPP 150",
    "question": "Vilken kommandoföljd konfigurerar HSRP-grupp 150 på R1 enligt provanteckningarna?",
    "options": [
      "standby 150 ip 192.168.1.1 följt av standby 150 priority 110 och standby 150 preempt.",
      "hsrp 150 ip 192.168.1.1 följt av hsrp 150 priority 110 och hsrp 150 preempt på porten.",
      "vrrp 150 ip 192.168.1.1 följt av vrrp 150 priority 110 och vrrp 150 master på porten.",
      "standby ip 192.168.1.1 följt av standby priority 110 och standby mode active på porten."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 6: 'R1(config-if)# standby 150 ip 192.168.1.1, standby 150 priority 110, standby 150 preempt, no shutdown'.",
    "ref": "PDF Sida 6: 'Den virtuella mac-addressen - exempel / R1 konfiguration'"
  },
  {
    "id": 52,
    "category": "topology-cli",
    "importance": "★ SVI-ADRESS REGEL",
    "question": "Varför konfigureras klienten ALDRIG med MLS1:s eller MLS2:s fysiska SVI-adress?",
    "options": [
      "För att redundansen då förloras helt – går den switchen ner tappar datorn nätverket.",
      "För att en Cisco-switch enligt standardprotokoll förbjuder ping mot en SVI-adress.",
      "För att fysiska SVI-adresser inte har nätmaskor och kan inte routas över Layer 3-nät.",
      "För att fysiska SVI-adresser automatiskt byter IP-adress var femte minut under drift."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4 & Labbguide: Klienten konfigureras med VIP (192.168.10.1), aldrig med de fysiska SVI-adresserna (.2 eller .3), för att redundansen ska fungera vid haveri.",
    "ref": "PDF Sida 4: 'kilenterna konfigueras att använda denna VIP som sin default gateway'"
  }
];

// ==========================================
// 2B. DIGINTO QUESTION DATABASE
// ==========================================
const DIGINTO_QUESTIONS = [
  {
    "id": "dig-1",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress använder HSRP version 1 respektive HSRP version 2 för Hello-meddelanden enligt Diginto?",
    "options": [
      "HSRP version 1 använder 224.0.0.2 och HSRP version 2 använder 224.0.0.102 i nätet.",
      "HSRP version 1 använder 224.0.0.18 och HSRP version 2 använder 224.0.0.2 i nätet.",
      "HSRP version 1 använder 224.0.0.102 och HSRP version 2 använder 224.0.0.254 i nät.",
      "Båda versionerna skickar broadcast (255.255.255.255) istället för multicast i nät."
    ],
    "correctIndex": 0,
    "explanation": "Enligt Diginto (Mer om FHRP): HSRP version 1 använder multicast-adressen 224.0.0.2, medan HSRP version 2 använder 224.0.0.102.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hot Standby Router Protocol)"
  },
  {
    "id": "dig-2",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress används i VRRP för att skicka annonseringar från Master router?",
    "options": [
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.18",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.20",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.10",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.90"
    ],
    "correctIndex": 0,
    "explanation": "VRRP använder den reserverade multicast-adressen 224.0.0.18 för kommunikation mellan Master och Backup-routrar.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Virtual Router Redundancy Protocol)"
  },
  {
    "id": "dig-3",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress använder GLBP för att koordinera lastbalansering mellan routrarna?",
    "options": [
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.102",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.200",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.180",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.254"
    ],
    "correctIndex": 0,
    "explanation": "GLBP använder multicast-adressen 224.0.0.102 för att koordinera lastbalansering och status mellan routrarna i gruppen (samma adress som HSRPv2!).",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    "id": "dig-4",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Vad är standardvärdena för Hello-timer och Hold-timer i HSRP enligt Diginto?",
    "options": [
      "Hello-timern är satt till 3 sekunder och Hold-timern är satt till 10 sekunder.",
      "Hello-timern är satt till 1 sekund och Hold-timern är satt till 3 sekunder här.",
      "Hello-timern är satt till 5 sekunder och Hold-timern är satt till 15 sekunder.",
      "Hello-timern är satt till 10 sekunder och Hold-timern är satt till 30 sekunder."
    ],
    "correctIndex": 0,
    "explanation": "Standardvärdet för HSRP Hello-timer är 3 sekunder, och Hold-timern (tiden standby väntar innan den tar över) är 10 sekunder.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ & hsrp-oversikt/"
  },
  {
    "id": "dig-5",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad är standardvärdena för Advertisement-intervall och failover i VRRP enligt Diginto?",
    "options": [
      "Advertisement-intervall är 1 sekund och failover sker inom 3 sekunder i nätet.",
      "Advertisement-intervall är 3 sekunder och failover sker inom 10 sekunder i nät.",
      "Advertisement-intervall är 5 sekunder och failover sker inom 15 sekunder i nät.",
      "Advertisement-intervall är 10 sekunder och failover sker inom 30 sekunder i nät."
    ],
    "correctIndex": 0,
    "explanation": "I VRRP skickar Master-routern uppdateringar var 1 sekund, och failover sker inom 3 sekunder om uppdateringar uteblir.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: VRRP & Timers i FHRP)"
  },
  {
    "id": "dig-6",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilken är den rekommenderade nedre gränsen för HSRP-timers enligt Diginto, och vad är risken om de sätts för lågt?",
    "options": [
      "Hello bör inte sättas under 1s och Hold inte under 4s på grund av risk för hög CPU-last och instabilitet.",
      "Hello bör inte sättas under 2s och Hold inte under 8s på grund av risk för överhettning i ASIC-kretsen.",
      "Hello bör inte sättas under 3s och Hold inte under 9s på grund av risk för paketloopar i nätverkshuben.",
      "Hello bör inte sättas under 5s och Hold inte under 15s på grund av risk för minnesläckor i operativet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto betonar: 'Hello-timern bör inte sättas under 1 sekund och Hold-timern inte under 4 sekunder, eftersom detta kan leda till ökad CPU-belastning och instabilitet i standby-tillståndet.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    "id": "dig-7",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Om två eller fler routrar i en FHRP/HSRP-grupp har exakt samma prioritet, vad fungerar som 'tiebreaker'?",
    "options": [
      "Den högsta numeriska IPv4-adressen på det deltagande gränssnittet utses till vinnare och blir aktiv router.",
      "Den lägsta fysiska MAC-adressen på routerns moderkort utses till vinnare och blir aktiv router i LAN-nätet.",
      "Den router som har längst sammanhängande drifttid (uptime) utses till vinnare och blir aktiv router här.",
      "Den router som har snabbast fysiska portkanal (t.ex. 10G över 1G) utses till vinnare och blir aktiv router."
    ],
    "correctIndex": 0,
    "explanation": "Diginto anger tydligt: 'Om två eller fler routrar har samma prioritet används deras högsta IP-adress som avgörande faktor. Den router med högst IP-adress på det interface som deltar i FHRP-gruppen blir då aktiv.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Tiebreaker)"
  },
  {
    "id": "dig-8",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT (NYCKELREGEL)",
    "question": "Vad händer om en router startar med SAMMA prioritet som den aktiva routern men en HÖGRE IPv4-adress, och 'preempt' är aktiverat?",
    "options": [
      "Den nya routern tar INTE över rollen, eftersom preemption i HSRP enbart utvärderar prioritet och inte IP.",
      "Den nya routern tar OMEDELBART över rollen, eftersom en högre IP-adress alltid tvingar fram ett ledarbyte.",
      "Båda routrarna delar upp utgående trafik 50/50 genom att köra automatisk lastdelning via round-robin här.",
      "HSRP-processen kraschar på båda enheterna och stänger av portarna på grund av detekterad IP-konflikt i LAN."
    ],
    "correctIndex": 0,
    "explanation": "Mycket viktig detaljregel från Diginto: 'Preemption påverkar ENDAST prioritet, inte IP-adress. En router med samma prioritet men en högre IPv4-adress kommer INTE att ta över rollen som aktiv router.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption)"
  },
  {
    "id": "dig-9",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilket intervall kan HSRP-prioritet justeras mellan i Cisco IOS, och vad är standardvärdet?",
    "options": [
      "Prioriteten justeras mellan 0 och 255 på gränssnittet, med standardvärdet satt till 100.",
      "Prioriteten justeras mellan 1 och 100 på gränssnittet, med standardvärdet satt till 500.",
      "Prioriteten justeras mellan 1 och 4096 på gränssnittet, med standardvärdet satt till 100.",
      "Prioriteten justeras mellan 0 och 65535 på gränssnittet, med standardvärdet satt till 320."
    ],
    "correctIndex": 0,
    "explanation": "Standardvärdet för HSRP-prioritet är 100, men det kan justeras mellan 0 och 255. Kommandot är: 'standby priority <värde>'.",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-prioritet)"
  },
  {
    "id": "dig-10",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "I Digintos labbexempel: R1 har prioritet 150 och preemption aktiverat. R2 har standardprioritet 100. Ett strömavbrott drabbar R1 och R2 tar över som aktiv. Vad sker när strömmen återställs till R1?",
    "options": [
      "R1 återtar automatiskt rollen som aktiv router eftersom preemption är aktivt och R1 har högre prioritet (150 mot 100).",
      "R2 förblir aktiv permanent eftersom en aktiv router enligt HSRP-standarden aldrig någonsin lämnar ifrån sig ledarrollen.",
      "R1 placeras permanent i standby-läge och måste startas om manuellt med reload för att kunna återfå sin aktiva ledarroll.",
      "Båda routrarna stänger ner sina fysiska nätverksinterface på grund av en konflikt med dubbla aktiva noder i gruppen här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'När strömmen återställs och R1 kommer online igen, kommer en ny valprocess att utlösas eftersom R1 har högre prioritet och preemption är aktiverat. Detta gör att R1 återtar rollen som aktiv router, medan R2 återgår till standby-läge.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption labbexempel)"
  },
  {
    "id": "dig-11",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad gäller om preemption är INAKTIVERAT på samtliga HSRP-routrar under valprocessen?",
    "options": [
      "Den router som startar först blir aktiv och behåller rollen så länge den fungerar, även om en senare nod har högre prio.",
      "Routern med högst prioritet tar ändå alltid över ledarrollen så fort den skickar sitt allra första hello-paket i nätet.",
      "Ingen av routrarna kan någonsin bli aktiv utan båda förblir låsta i Speak-tillståndet tills standby preempt konfigureras.",
      "Routrarna växlar ledarrollen mellan sig var femte minut för att förhindra att en enskild enhet överbelastas av trafiken."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Om preemption är inaktiverat kommer den router som startar först att bli aktiv om inga andra routrar är online vid valprocessen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Obs-ruta)"
  },
  {
    "id": "dig-12",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Hur definierar Diginto HSRP-tillståndet 'Initial'?",
    "options": [
      "Routern är i startläge och har ännu inte deltagit i gruppen; detta är första tillståndet efter aktivering.",
      "Routern skickar aktiva hellos för att utmana befintliga noder och kräva omedelbart ledarskap i nätverket.",
      "Routern har vunnit valprocessen och vidarebefordrar redan alla datapaket från de lokala klientdatorerna.",
      "Routern lyssnar uteslutande på inkommande ARP-förfrågningar utan att registrera några grannroutrar i RAM."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Initial – Routern är i startläge och har ännu inte deltagit i HSRP-gruppen. Detta är det första tillståndet efter att interfacet har aktiverats eller routern startats om.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-13",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad är den exakta funktionen för HSRP-tillståndet 'Learn' enligt Diginto?",
    "options": [
      "Routern väntar på ett hello-meddelande från en annan router för att lära sig gruppens virtuella IP-adress.",
      "Routern laddar ner routingtabeller via OSPF och EIGRP från den primära distributionsswitchen i nätverket.",
      "Routern analyserar klienternas MAC-adresser för att dynamiskt konfigurera accessportarnas VLAN-tilldelning.",
      "Routern utför ett hårdvarutest av alla anslutna switchportar för att verifiera länkhastighet och duplexläge."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Learn – Routern väntar på att ta emot ett Hello-meddelande från en annan HSRP-router för att lära sig den virtuella IP-adressen. Om den inte får någon information under denna fas, går den över till Speak-tillståndet.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-14",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Hur beskrivs HSRP-tillståndet 'Listen' i Diginto?",
    "options": [
      "Routern lyssnar på hello-meddelanden men har ingen aktiv roll; den känner till virtuella IP:n och är passiv.",
      "Routern skickar ut kontinuerliga ARP-förfrågningar till alla anslutna klienter för att kartlägga nätverket.",
      "Routern agerar backup för standby-routern och vidarebefordrar exakt hälften av all inkommande datatrafik.",
      "Routern väntar på att administratören ska godkänna anslutningen manuellt genom kommandot no shutdown här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Listen – Routern lyssnar på Hello-meddelanden men har ingen aktiv roll. Den känner till den virtuella IP-adressen och är en passiv medlem i HSRP-gruppen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-15",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad gör routern i HSRP-tillståndet 'Speak'?",
    "options": [
      "Den skickar ut hello-meddelanden för att meddela sin närvaro och deltar aktivt i valprocessen för gruppen.",
      "Den skickar röstmeddelanden (VoIP) direkt till företagets telefonväxel för att prioritera talkommunikation.",
      "Den stänger ner grannroutrarnas fysiska portar genom att injicera felaktiga BPDU-ramar på Layer 2-switchen.",
      "Den vidarebefordrar datatrafik direkt till internetleverantören utan att konsultera den lokala routingen."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Speak – Routern skickar ut Hello-meddelanden för att meddela sin närvaro och deltar i valprocessen för att bli aktiv eller standby-router.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-16",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilket specifikt krav gäller för att en router ska kunna nå statusen 'Active' eller 'Standby'?",
    "options": [
      "Den kan endast nå Active eller Standby om den har fått en virtuell IP-adress och genomgått valprocessen.",
      "Den måste ha minst en fysisk 10 Gbps fiberlänk ansluten till alla lokala distributionsswitchar i hallen.",
      "Den måste ha sin prioritet manuellt konfigurerad till ett värde över 200 via administratörens CLI-konsol.",
      "Den måste köra Cisco IOS version 17 eller senare med en särskild enterprise-licens installerad i minnet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto Obs-ruta: 'En router kan endast vara i Active eller Standby-status om den har fått en virtuell IP-adress och genomgått valprocessen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    "id": "dig-17",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Hur skiljer sig GLBP:s trafikfördelning från traditionell dynamisk lastbalansering enligt Diginto?",
    "options": [
      "GLBP använder statisk fördelning enligt en vald algoritm och mäter inte belastningen dynamiskt i realtid.",
      "GLBP mäter bandbreddsutnyttjandet på varje enskild länk varje millisekund och flyttar sessioner i realtid.",
      "GLBP kan enbart användas i nätverk med manuellt tilldelade statiska IP-adresser utan DHCP-funktionalitet.",
      "GLBP fördelar uteslutande UDP-trafik över nätverket medan alla TCP-sessioner blockeras av brandväggen här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto förklarar: 'GLBP använder dock statisk fördelning, vilket innebär att det inte aktivt övervakar trafikbelastningen och dynamiskt justerar trafiken mellan routrarna. Istället sker fördelningen enligt en vald algoritm.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    "id": "dig-18",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad innebär metoden 'Per-MAC' vid lastbalansering i GLBP enligt Diginto?",
    "options": [
      "Varje router får en unik virtuell MAC kopplad till gatewayen och klienter fördelas mellan dessa adresser.",
      "Routern byter MAC-adress på sin egen fysiska switchport var tredje sekund för att förvilla angripare här.",
      "Klienternas hårdvaruadresser binds permanent i routerns startup-config för att förhindra obehöriga byten.",
      "Endast klienter med certifierade MAC-adresser tillåts skicka datatrafik ut på leverantörens externa nät."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Per-MAC: Varje router får en unik MAC-adress kopplad till den virtuella gatewayen. Klienter fördelas mellan dessa MAC-adresser för att sprida trafiken.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    "id": "dig-19",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad innebär metoden 'Per-destination' vid lastbalansering i GLBP enligt Diginto?",
    "options": [
      "Trafiken delas upp baserat på destinations-IP så att varje router ansvarar för trafik till specifika mål.",
      "All användartrafik måste alltid dirigeras till en och samma centrala proxyserver för inspektion i molnet.",
      "Klienten väljer själv vilken destinationsrouter den vill skicka paket till genom automatiska traceroutes.",
      "Routrarna dirigerar alltid inkommande paket i alfabetisk ordning baserat på domännamnet i webbadressen."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Per-destination: Trafiken delas upp baserat på destinationens IP-adress. Varje router i GLBP-gruppen ansvarar för att vidarebefordra trafik till vissa destinationer, istället för att slumpmässigt fördela trafiken per klient.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    "id": "dig-20",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Vilka två protokollversioner erbjuder Cisco för HSRP enligt Diginto för transparent failover?",
    "options": [
      "Cisco erbjuder HSRP för IPv4 samt HSRP för IPv6 för att säkerställa kontinuerlig tillgänglighet.",
      "Cisco erbjuder HSRP Standard samt HSRP Turbo för att säkerställa högsta nätverkstillgänglighet.",
      "Cisco erbjuder HSRP Classic samt HSRP Enterprise för att säkerställa kontinuerlig tillgänglighet.",
      "Cisco erbjuder endast HSRP version 1 officiellt för att säkerställa kontinuerlig tillgänglighet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto (HSRP översikt): 'Cisco erbjuder HSRP och HSRP för IPv6 för att säkerställa nätverksanslutning även om default gateway misslyckas.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/"
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
// ==========================================
// 3. CLI COMMANDS DATABASE (15 Provviktiga HSRP-kommandon)
// ==========================================
const COMMANDS_DB = [
  {
    id: "cmd-v2",
    title: "1. Aktivera HSRP Version 2",
    desc: "På interface vlan 10 måste version 2 aktiveras för att stödja gruppnummer upp till 4095, IPv6 och MAC-intervall 0000.0c9f.f000 till 0000.0c9f.ffff.",
    context: "MLS1(config)# interface vlan 10",
    prompt: "MLS1(config-if)#",
    canonical: "standby version 2",
    validRegex: /^standby\s+ver(sion)?\s+2$/i
  },
  {
    id: "cmd-vip",
    title: "2. Konfigurera Virtuell IP-adress (VIP)",
    desc: "Skapa HSRP-grupp 10 och tilldela den virtuella IP-adressen 192.168.10.1 som PC-klienterna ska ha som default gateway.",
    context: "MLS1(config)# interface vlan 10",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 ip 192.168.10.1",
    validRegex: /^standby\s+10\s+ip\s+192\.168\.10\.1$/i
  },
  {
    id: "cmd-prio",
    title: "3. Sätt HSRP Prioritet (110)",
    desc: "Sätt prioriteten för HSRP-grupp 10 till 110 så att denna switch vinner valet och blir primär Active router framför standarden 100.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 priority 110",
    validRegex: /^standby\s+10\s+pri(ority)?\s+110$/i
  },
  {
    id: "cmd-preempt",
    title: "4. Aktivera Preemption",
    desc: "Aktivera preemption för grupp 10 så att routern automatiskt kan återta rollen som Active vid en omstart om den har högst prioritet.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 preempt",
    validRegex: /^standby\s+10\s+pre(empt)?$/i
  },
  {
    id: "cmd-preempt-delay",
    title: "5. Konfigurera Preempt Delay (30 sek)",
    desc: "Fördröj preemption med minst 30 sekunder efter boot så att routingprotokoll som OSPF/EIGRP hinner konvergera innan trafiken tas över.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 preempt delay minimum 30",
    validRegex: /^standby\s+10\s+pre(empt)?\s+delay\s+min(imum)?\s+30$/i
  },
  {
    id: "cmd-track",
    title: "6. Interface Tracking mot Uplink",
    desc: "Övervaka uplänken gigabitEthernet 1/0/5 för grupp 10 med ett prioritetavdrag på 20 vid avbrott för att skydda mot black holes.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 track gigabitEthernet 1/0/5 20",
    validRegex: /^standby\s+10\s+track\s+(g|gi|gigabitethernet)?\s*1\/0\/5\s+20$/i
  },
  {
    id: "cmd-timers",
    title: "7. Snabbare Timers (Hello 1s, Hold 3s)",
    desc: "Justera HSRP-timers för grupp 10 till Hello 1 sekund och Hold 3 sekunder (3x-regeln) för snabbare felväxling.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 timers 1 3",
    validRegex: /^standby\s+10\s+timers\s+1\s+3$/i
  },
  {
    id: "cmd-auth",
    title: "8. MD5 Kryptografisk Autentisering",
    desc: "Säkra HSRP-grupp 10 med kryptografisk MD5-autentisering och nyckelsträngen Cisco123 för att stoppa spoofing.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 authentication md5 key-string Cisco123",
    validRegex: /^standby\s+10\s+auth(entication)?\s+md5\s+key-string\s+Cisco123$/i
  },
  {
    id: "cmd-name",
    title: "9. Namnge HSRP-gruppen",
    desc: "Ge HSRP-grupp 10 det beskrivande namnet HSRP_LAN för tydlig identifiering och dokumentation i konfigurationen.",
    context: "MLS1(config-if)#",
    prompt: "MLS1(config-if)#",
    canonical: "standby 10 name HSRP_LAN",
    validRegex: /^standby\s+10\s+name\s+HSRP_LAN$/i
  },
  {
    id: "cmd-150-ip",
    title: "10. Konfigurera Grupp 150 Virtuell IP",
    desc: "På interface g0/1, konfigurera HSRP-grupp 150 med den virtuella IP-adressen 192.168.1.1 enligt provanteckningarna.",
    context: "R1(config)# interface g0/1",
    prompt: "R1(config-if)#",
    canonical: "standby 150 ip 192.168.1.1",
    validRegex: /^standby\s+150\s+ip\s+192\.168\.1\.1$/i
  },
  {
    id: "cmd-150-prio",
    title: "11. Sätt Grupp 150 Prioritet till 110",
    desc: "Sätt HSRP-prioriteten för grupp 150 till 110 så att R1 vinner valet och blir Active framför R2 (som har standard 100).",
    context: "R1(config-if)#",
    prompt: "R1(config-if)#",
    canonical: "standby 150 priority 110",
    validRegex: /^(standby\s+150\s+priority\s+110|standby\s+150\s+prio\s+110)$/i
  },
  {
    id: "cmd-150-preempt",
    title: "12. Aktivera Preemption för Grupp 150",
    desc: "Aktivera preemption för HSRP-grupp 150 så att R1 kan återta ledarrollen som Active om den startar om efter ett fel.",
    context: "R1(config-if)#",
    prompt: "R1(config-if)#",
    canonical: "standby 150 preempt",
    validRegex: /^standby\s+150\s+pre(empt)?$/i
  },
  {
    id: "cmd-show-brief",
    title: "13. Kontrollera HSRP Sammanfattning",
    desc: "Provets viktigaste kontrollkommando för att visa en kompakt sammanfattningstabell över alla grupper, prioritet, tillstånd och VIP.",
    context: "",
    prompt: "MLS1#",
    canonical: "show standby brief",
    validRegex: /^(show|sh)\s+stand(by)?\s+br(ief)?$/i
  },
  {
    id: "cmd-show-full",
    title: "14. Kontrollera Detaljerad HSRP-status",
    desc: "Visa all detaljerad information om HSRP inklusive virtuell MAC-adress, exakta timers, aktiva/standby IP samt tracking.",
    context: "",
    prompt: "MLS1#",
    canonical: "show standby",
    validRegex: /^(show|sh)\s+stand(by)?$/i
  },
  {
    id: "cmd-debug",
    title: "15. Felsök HSRP-tillstånd i Realtid",
    desc: "Aktivera felsökningsutskrifter på konsolen för att övervaka HSRP-händelser och tillståndsbyten (Listen, Speak, Standby, Active) i realtid.",
    context: "",
    prompt: "MLS1#",
    canonical: "debug standby events",
    validRegex: /^(debug|deb)\s+stand(by)?\s+events$/i
  }
];

// ==========================================
// 4. FULL CONFIGURATIONS DATABASE (Tab 3)
// ==========================================
const LAB_CONFIGS = {
  labb6: {
    id: "labb6",
    title: "Labb 6: Feltolerant nätverk",
    url: "https://administration-utrustning.diginto.se/fhrp-koncepten/labb-6-feltolerant-natverk/",
    badge: "Feltolerant Nätverk",
    devices: {
      s1: {
        id: "s1",
        name: "S1 (Access-switch)",
        role: "Access-lager • VLAN 10 & 20 • Rapid-PVST+ • Trunk",
        roleBadge: "Access Switch",
        contextTitle: "S1 Konfiguration & Nätverksroll",
        note: "Access-switch ansluten till elever på Fa0/1 (VLAN 10 ELEVER) och personal på Fa0/2 (VLAN 20 PERSONAL). Portfast och BPDU Guard aktiverade. Rapid-PVST+ med trunk på Gi0/1-2 till DS1 & DS2.",
        params: [
          { key: "VLAN 10", val: "ELEVER (Fa0/1 - Access)" },
          { key: "VLAN 20", val: "PERSONAL (Fa0/2 - Access)" },
          { key: "STP-läge", val: "spanning-tree mode rapid-pvst" },
          { key: "Portskydd", val: "spanning-tree portfast, bpduguard enable" },
          { key: "Trunk-portar", val: "Gi0/1-2 allowed vlan 10,20" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "S1>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "S1#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "S1(config)#", target: "hostname S1", label: "Sätt hostname S1" },
              { prefix: "S1(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "S1(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "S1(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "S1(config-line)#", target: "exit", label: "Lämna line" }
            ]
          },
          {
            title: "Steg 2 - VLAN och Accessport-konfiguration",
            items: [
              { prefix: "S1(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "S1(config-vlan)#", target: "name ELEVER", label: "Namnge VLAN 10 ELEVER" },
              { prefix: "S1(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "S1(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "S1(config-vlan)#", target: "name PERSONAL", label: "Namnge VLAN 20 PERSONAL" },
              { prefix: "S1(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "S1(config)#", target: "interface fastEthernet 0/1", label: "Port Fa0/1 för elever" },
              { prefix: "S1(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S1(config-if)#", target: "switchport access vlan 10", label: "Koppla till VLAN 10" },
              { prefix: "S1(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S1(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "S1(config)#", target: "interface fastEthernet 0/2", label: "Port Fa0/2 för personal" },
              { prefix: "S1(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S1(config-if)#", target: "switchport access vlan 20", label: "Koppla till VLAN 20" },
              { prefix: "S1(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S1(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - Trunk-konfiguration",
            items: [
              { prefix: "S1(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "S1(config)#", target: "interface range gigabitEthernet 0/1-2", label: "Välj trunk-länkar Gi0/1-2" },
              { prefix: "S1(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "S1(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "S1(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "S1(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "S1(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "S1#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      s2: {
        id: "s2",
        name: "S2 (Access-switch)",
        role: "Access-lager • VLAN 10 & 20 • Rapid-PVST+ • Trunk",
        roleBadge: "Access Switch",
        contextTitle: "S2 Konfiguration & Nätverksroll",
        note: "Access-switch ansluten till elever på Fa0/1 (VLAN 10 ELEVER) och personal på Fa0/2 (VLAN 20 PERSONAL). Portfast & BPDU Guard aktiverade. Rapid-PVST+ med trunk på Gi0/1-2.",
        params: [
          { key: "VLAN 10", val: "ELEVER (Fa0/1 - Access)" },
          { key: "VLAN 20", val: "PERSONAL (Fa0/2 - Access)" },
          { key: "STP-läge", val: "spanning-tree mode rapid-pvst" },
          { key: "Portskydd", val: "spanning-tree portfast, bpduguard enable" },
          { key: "Trunk-portar", val: "Gi0/1-2 allowed vlan 10,20" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "S2>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "S2#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "S2(config)#", target: "hostname S2", label: "Sätt hostname S2" },
              { prefix: "S2(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "S2(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "S2(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "S2(config-line)#", target: "exit", label: "Lämna line" }
            ]
          },
          {
            title: "Steg 2 - VLAN och Accessport-konfiguration",
            items: [
              { prefix: "S2(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "S2(config-vlan)#", target: "name ELEVER", label: "Namnge VLAN 10 ELEVER" },
              { prefix: "S2(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "S2(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "S2(config-vlan)#", target: "name PERSONAL", label: "Namnge VLAN 20 PERSONAL" },
              { prefix: "S2(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "S2(config)#", target: "interface fastEthernet 0/1", label: "Port Fa0/1 elever" },
              { prefix: "S2(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S2(config-if)#", target: "switchport access vlan 10", label: "Koppla till VLAN 10" },
              { prefix: "S2(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S2(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "S2(config)#", target: "interface fastEthernet 0/2", label: "Port Fa0/2 personal" },
              { prefix: "S2(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S2(config-if)#", target: "switchport access vlan 20", label: "Koppla till VLAN 20" },
              { prefix: "S2(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S2(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - Trunk-konfiguration",
            items: [
              { prefix: "S2(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "S2(config)#", target: "interface range gigabitEthernet 0/1-2", label: "Välj trunk-länkar Gi0/1-2" },
              { prefix: "S2(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "S2(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "S2(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "S2(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "S2(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "S2#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      ds1: {
        id: "ds1",
        name: "DS1 (Distributionsswitch)",
        role: "Root Prim V10 • HSRP Active V10 (110) • LACP • Track Uplink • OSPF",
        roleBadge: "Root Prim V10 • HSRP 110",
        contextTitle: "DS1 Konfiguration & Nätverksroll",
        note: "DS1 är STP Root Bridge för VLAN 10 och sekundär för VLAN 20. HSRP Active för VLAN 10 (Prio 110). Har Object Tracking (track 1) mot Gi1/0/5 som sänker prioriteten med 20 om upplänken till R3 bryts. OSPF Area 0 med passiva VLAN-SVI:er.",
        params: [
          { key: "Routing", val: "ip routing aktiverat" },
          { key: "STP Roller", val: "VLAN 10 root primary, VLAN 20 root secondary" },
          { key: "EtherChannel", val: "Gi1/0/3-4 -> port-channel 1 (mode active LACP)" },
          { key: "Trunks mot Access", val: "Gi1/0/1 (S1), Gi1/0/2 (S2)" },
          { key: "Object Tracking", val: "track 1 interface gigabitEthernet 1/0/5 line-protocol" },
          { key: "HSRP VLAN 10", val: "10.10.1.2/24 | VIP 10.10.1.1 | Prio 110 | Preempt | Track 1 dec 20" },
          { key: "HSRP VLAN 20", val: "10.20.1.2/24 | VIP 10.20.1.1 | Prio 100 | Preempt" },
          { key: "Routad länk R3", val: "Gi1/0/5: 10.1.3.1 /30 (no switchport)" },
          { key: "OSPF", val: "Process 1, RID 1.1.1.1, Passiva Vlan10/20, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "DS1>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "DS1#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "DS1(config)#", target: "hostname DS1", label: "Sätt hostname DS1" },
              { prefix: "DS1(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "DS1(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "DS1(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "DS1(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - VLAN-konfiguration",
            items: [
              { prefix: "DS1(config)#", target: "ip routing", label: "Aktivera Inter-VLAN Routing" },
              { prefix: "DS1(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "DS1(config-vlan)#", target: "name ELEVER", label: "Namnge VLAN 10 ELEVER" },
              { prefix: "DS1(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "DS1(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "DS1(config-vlan)#", target: "name PERSONAL", label: "Namnge VLAN 20 PERSONAL" },
              { prefix: "DS1(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "DS1(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "DS1(config)#", target: "spanning-tree vlan 10 root primary", label: "Root primary för VLAN 10" },
              { prefix: "DS1(config)#", target: "spanning-tree vlan 20 root secondary", label: "Root secondary för VLAN 20" }
            ]
          },
          {
            title: "Steg 3 - Trunking och EtherChannel (LACP)",
            items: [
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/1", label: "Konfigurera port mot S1" },
              { prefix: "DS1(config-if)#", target: "description Trunk-link to S1", label: "Beskrivning för länk mot S1" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Aktivera porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/2", label: "Konfigurera port mot S2" },
              { prefix: "DS1(config-if)#", target: "description Trunk-link to S2", label: "Beskrivning för länk mot S2" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Aktivera porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj länkpar mot DS2" },
              { prefix: "DS1(config-if-range)#", target: "description Trunk-link to DS2 LACP", label: "Beskrivning för LACP" },
              { prefix: "DS1(config-if-range)#", target: "shutdown", label: "Stäng ner portarna inför bundling" },
              { prefix: "DS1(config-if-range)#", target: "channel-group 1 mode active", label: "Bundla i port-channel 1 (LACP active)" },
              { prefix: "DS1(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "DS1(config)#", target: "interface port-channel 1", label: "Konfigurera virtuella port-channel 1" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt port-channel som trunk" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20 på port-channel" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Aktivera port-channel 1" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj länkpar mot DS2 igen" },
              { prefix: "DS1(config-if-range)#", target: "no shutdown", label: "Starta Gi1/0/3-4" },
              { prefix: "DS1(config-if-range)#", target: "exit", label: "Lämna range" }
            ]
          },
          {
            title: "Steg 4 - Object Tracking (Feltolerans)",
            items: [
              { prefix: "DS1(config)#", target: "track 1 interface gigabitEthernet 1/0/5 line-protocol", label: "Övervaka routad upplänk mot R3" }
            ]
          },
          {
            title: "Steg 5 - HSRP Gateway redundans",
            items: [
              { prefix: "DS1(config)#", target: "interface Vlan 10", label: "Konfigurera SVI VLAN 10" },
              { prefix: "DS1(config-if)#", target: "ip address 10.10.1.2 255.255.255.0", label: "Fysisk IP-adress för VLAN 10" },
              { prefix: "DS1(config-if)#", target: "standby 10 ip 10.10.1.1", label: "Virtuell gateway IP (Grupp 10)" },
              { prefix: "DS1(config-if)#", target: "standby 10 priority 110", label: "HSRP prioritet 110 (Aktiv)" },
              { prefix: "DS1(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "DS1(config-if)#", target: "standby 10 track 1 decrement 20", label: "Sänk prio med 20 vid fel på track 1" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta interface VLAN 10" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface Vlan 20", label: "Konfigurera SVI VLAN 20" },
              { prefix: "DS1(config-if)#", target: "ip address 10.20.1.2 255.255.255.0", label: "Fysisk IP-adress för VLAN 20" },
              { prefix: "DS1(config-if)#", target: "standby 20 ip 10.20.1.1", label: "Virtuell gateway IP (Grupp 20)" },
              { prefix: "DS1(config-if)#", target: "standby 20 priority 100", label: "HSRP prioritet 100 (Standby)" },
              { prefix: "DS1(config-if)#", target: "standby 20 preempt", label: "Aktivera Preemption" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta interface VLAN 20" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/5", label: "Konfigurera upplänk mot R3" },
              { prefix: "DS1(config-if)#", target: "description Routad uplink till R3", label: "Beskrivning" },
              { prefix: "DS1(config-if)#", target: "no switchport", label: "Gör till routad Layer 3-port" },
              { prefix: "DS1(config-if)#", target: "ip address 10.1.3.1 255.255.255.252", label: "IP mot R3 (/30)" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 6 - Routing med OSPF",
            items: [
              { prefix: "DS1(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "DS1(config-router)#", target: "router-id 1.1.1.1", label: "Sätt Router-ID 1.1.1.1" },
              { prefix: "DS1(config-router)#", target: "passive-interface Vlan10", label: "Passivt gränssnitt VLAN 10" },
              { prefix: "DS1(config-router)#", target: "passive-interface Vlan20", label: "Passivt gränssnitt VLAN 20" },
              { prefix: "DS1(config-router)#", target: "network 10.1.3.0 0.0.0.3 area 0", label: "Annonsera upplänksnät mot R3" },
              { prefix: "DS1(config-router)#", target: "network 10.10.1.0 0.0.0.255 area 0", label: "Annonsera VLAN 10 nätverk" },
              { prefix: "DS1(config-router)#", target: "network 10.20.1.0 0.0.0.255 area 0", label: "Annonsera VLAN 20 nätverk" },
              { prefix: "DS1(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "DS1(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "DS1#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      ds2: {
        id: "ds2",
        name: "DS2 (Distributionsswitch)",
        role: "Root Prim V20 • HSRP Active V20 (110) • LACP • Track Uplink • OSPF",
        roleBadge: "Root Prim V20 • HSRP 110",
        contextTitle: "DS2 Konfiguration & Nätverksroll",
        note: "DS2 är STP Root Bridge för VLAN 20 och sekundär för VLAN 10. HSRP Active för VLAN 20 (Prio 110). Har Object Tracking (track 1) mot Gi1/0/5 mot R4 som sänker HSRP-prioriteten med 20 vid avbrott. OSPF Area 0 med passiva VLAN-SVI:er.",
        params: [
          { key: "Routing", val: "ip routing aktiverat" },
          { key: "STP Roller", val: "VLAN 10 root secondary, VLAN 20 root primary" },
          { key: "EtherChannel", val: "Gi1/0/3-4 -> port-channel 1 (mode active LACP)" },
          { key: "Trunks mot Access", val: "Gi1/0/1 (S2), Gi1/0/2 (S1)" },
          { key: "Object Tracking", val: "track 1 interface gigabitEthernet 1/0/5 line-protocol" },
          { key: "HSRP VLAN 10", val: "10.10.1.3/24 | VIP 10.10.1.1 | Prio 100 | Preempt" },
          { key: "HSRP VLAN 20", val: "10.20.1.3/24 | VIP 10.20.1.1 | Prio 110 | Preempt | Track 1 dec 20" },
          { key: "Routad länk R4", val: "Gi1/0/5: 10.1.4.1 /30 (no switchport)" },
          { key: "OSPF", val: "Process 1, RID 2.2.2.2, Passiva Vlan10/20, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "DS2>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "DS2#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "DS2(config)#", target: "hostname DS2", label: "Sätt hostname DS2" },
              { prefix: "DS2(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "DS2(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "DS2(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "DS2(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - VLAN-konfiguration",
            items: [
              { prefix: "DS2(config)#", target: "ip routing", label: "Aktivera Inter-VLAN Routing" },
              { prefix: "DS2(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "DS2(config-vlan)#", target: "name ELEVER", label: "Namnge VLAN 10 ELEVER" },
              { prefix: "DS2(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "DS2(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "DS2(config-vlan)#", target: "name PERSONAL", label: "Namnge VLAN 20 PERSONAL" },
              { prefix: "DS2(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "DS2(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "DS2(config)#", target: "spanning-tree vlan 10 root secondary", label: "Root secondary för VLAN 10" },
              { prefix: "DS2(config)#", target: "spanning-tree vlan 20 root primary", label: "Root primary för VLAN 20" }
            ]
          },
          {
            title: "Steg 3 - Trunking och EtherChannel (LACP)",
            items: [
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/1", label: "Konfigurera port mot S2" },
              { prefix: "DS2(config-if)#", target: "description Trunk-link to S2", label: "Beskrivning för länk mot S2" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Aktivera porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/2", label: "Konfigurera port mot S1" },
              { prefix: "DS2(config-if)#", target: "description Trunk-link to S1", label: "Beskrivning för länk mot S1" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Aktivera porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj länkpar mot DS1" },
              { prefix: "DS2(config-if-range)#", target: "description Trunk-link to DS1 LACP", label: "Beskrivning för LACP" },
              { prefix: "DS2(config-if-range)#", target: "shutdown", label: "Stäng ner portarna inför bundling" },
              { prefix: "DS2(config-if-range)#", target: "channel-group 1 mode active", label: "Bundla i port-channel 1 (LACP active)" },
              { prefix: "DS2(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "DS2(config)#", target: "interface port-channel 1", label: "Konfigurera virtuella port-channel 1" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt port-channel som trunk" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20 på port-channel" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Aktivera port-channel 1" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj länkpar mot DS1 igen" },
              { prefix: "DS2(config-if-range)#", target: "no shutdown", label: "Starta Gi1/0/3-4" },
              { prefix: "DS2(config-if-range)#", target: "exit", label: "Lämna range" }
            ]
          },
          {
            title: "Steg 4 - Object Tracking (Feltolerans)",
            items: [
              { prefix: "DS2(config)#", target: "track 1 interface gigabitEthernet 1/0/5 line-protocol", label: "Övervaka routad upplänk mot R4" }
            ]
          },
          {
            title: "Steg 5 - HSRP Gateway redundans",
            items: [
              { prefix: "DS2(config)#", target: "interface Vlan 10", label: "Konfigurera SVI VLAN 10" },
              { prefix: "DS2(config-if)#", target: "ip address 10.10.1.3 255.255.255.0", label: "Fysisk IP-adress för VLAN 10" },
              { prefix: "DS2(config-if)#", target: "standby 10 ip 10.10.1.1", label: "Virtuell gateway IP (Grupp 10)" },
              { prefix: "DS2(config-if)#", target: "standby 10 priority 100", label: "HSRP prioritet 100 (Standby)" },
              { prefix: "DS2(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta interface VLAN 10" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface Vlan 20", label: "Konfigurera SVI VLAN 20" },
              { prefix: "DS2(config-if)#", target: "ip address 10.20.1.3 255.255.255.0", label: "Fysisk IP-adress för VLAN 20" },
              { prefix: "DS2(config-if)#", target: "standby 20 ip 10.20.1.1", label: "Virtuell gateway IP (Grupp 20)" },
              { prefix: "DS2(config-if)#", target: "standby 20 priority 110", label: "HSRP prioritet 110 (Aktiv)" },
              { prefix: "DS2(config-if)#", target: "standby 20 preempt", label: "Aktivera Preemption" },
              { prefix: "DS2(config-if)#", target: "standby 20 track 1 decrement 20", label: "Sänk prio med 20 vid fel på track 1" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta interface VLAN 20" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/5", label: "Konfigurera upplänk mot R4" },
              { prefix: "DS2(config-if)#", target: "description Routad uplink till R4", label: "Beskrivning" },
              { prefix: "DS2(config-if)#", target: "no switchport", label: "Gör till routad Layer 3-port" },
              { prefix: "DS2(config-if)#", target: "ip address 10.1.4.1 255.255.255.252", label: "IP mot R4 (/30)" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 6 - Routing med OSPF",
            items: [
              { prefix: "DS2(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "DS2(config-router)#", target: "router-id 2.2.2.2", label: "Sätt Router-ID 2.2.2.2" },
              { prefix: "DS2(config-router)#", target: "passive-interface Vlan10", label: "Passivt gränssnitt VLAN 10" },
              { prefix: "DS2(config-router)#", target: "passive-interface Vlan20", label: "Passivt gränssnitt VLAN 20" },
              { prefix: "DS2(config-router)#", target: "network 10.1.4.0 0.0.0.3 area 0", label: "Annonsera upplänksnät mot R4" },
              { prefix: "DS2(config-router)#", target: "network 10.10.1.0 0.0.0.255 area 0", label: "Annonsera VLAN 10 nätverk" },
              { prefix: "DS2(config-router)#", target: "network 10.20.1.0 0.0.0.255 area 0", label: "Annonsera VLAN 20 nätverk" },
              { prefix: "DS2(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "DS2(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "DS2#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      r3: {
        id: "r3",
        name: "R3 (Core-router)",
        role: "Core/Routing • HSRP Active (VIP 10.32.1.1 Prio 110) • Track g0/0 dec 20 • OSPF",
        roleBadge: "HSRP Active • Prio 110",
        contextTitle: "R3 Konfiguration & Nätverksroll",
        note: "Core-router ansluten till distributionslagret (DS1) via Gi0/0 och till serversegmentet via Gi0/1. Agerar HSRP Active (VIP 10.32.1.1, Prio 110). Övervakar länk Gi0/0 mot DS1 (sänker prio med 20). OSPF Area 0.",
        params: [
          { key: "Länk mot DS1", val: "Gi0/0: 10.1.3.2 /30" },
          { key: "HSRP Länk (Gi0/1)", val: "10.32.1.2/24 | VIP 10.32.1.1 | Prio 110 | Preempt" },
          { key: "Object Tracking", val: "track 1 interface gigabitEthernet 0/0 line-protocol" },
          { key: "OSPF", val: "router ospf 1, RID 3.3.3.3, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "R3>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "R3#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "R3(config)#", target: "hostname R3", label: "Sätt hostname R3" },
              { prefix: "R3(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "R3(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "R3(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "R3(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - Object Tracking (Feltolerans)",
            items: [
              { prefix: "R3(config)#", target: "track 1 interface gigabitEthernet 0/0 line-protocol", label: "Övervaka routad port mot DS1" },
              { prefix: "R3(config)#", target: "interface gigabitEthernet 0/0", label: "Konfigurera port mot DS1" },
              { prefix: "R3(config-if)#", target: "description Routed-link to DS1", label: "Beskrivning" },
              { prefix: "R3(config-if)#", target: "ip address 10.1.3.2 255.255.255.252", label: "IP mot DS1 (/30)" },
              { prefix: "R3(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R3(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - HSRP Gateway redundans",
            items: [
              { prefix: "R3(config)#", target: "interface gigabitEthernet 0/1", label: "Konfigurera serverlänk Gi0/1" },
              { prefix: "R3(config-if)#", target: "description HSRP-link", label: "Beskrivning" },
              { prefix: "R3(config-if)#", target: "ip address 10.32.1.2 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "R3(config-if)#", target: "standby 10 ip 10.32.1.1", label: "Virtuell gateway IP" },
              { prefix: "R3(config-if)#", target: "standby 10 priority 110", label: "HSRP prioritet 110 (Aktiv)" },
              { prefix: "R3(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "R3(config-if)#", target: "standby 10 track 1 decrement 20", label: "Sänk prio med 20 vid länkfel" },
              { prefix: "R3(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R3(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 4 - Routing med OSPF",
            items: [
              { prefix: "R3(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "R3(config-router)#", target: "router-id 3.3.3.3", label: "Sätt Router-ID 3.3.3.3" },
              { prefix: "R3(config-router)#", target: "network 10.1.3.0 0.0.0.3 area 0", label: "Annonsera länk mot DS1" },
              { prefix: "R3(config-router)#", target: "network 10.32.1.0 0.0.0.255 area 0", label: "Annonsera servernätverk" },
              { prefix: "R3(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "R3(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "R3#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      r4: {
        id: "r4",
        name: "R4 (Core-router)",
        role: "Core/Routing • HSRP Standby (VIP 10.32.1.1 Prio 100) • Track g0/0 dec 20 • OSPF",
        roleBadge: "HSRP Standby • Prio 100",
        contextTitle: "R4 Konfiguration & Nätverksroll",
        note: "Core-router ansluten till distributionslagret (DS2) via Gi0/0 och till serversegmentet via Gi0/1. Agerar HSRP Standby (VIP 10.32.1.1, Prio 100). Övervakar länk Gi0/0 mot DS2. OSPF Area 0.",
        params: [
          { key: "Länk mot DS2", val: "Gi0/0: 10.1.4.2 /30" },
          { key: "HSRP Länk (Gi0/1)", val: "10.32.1.3/24 | VIP 10.32.1.1 | Prio 100 | Preempt" },
          { key: "Object Tracking", val: "track 1 interface gigabitEthernet 0/0 line-protocol" },
          { key: "OSPF", val: "router ospf 1, RID 4.4.4.4, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "R4>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "R4#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "R4(config)#", target: "hostname R4", label: "Sätt hostname R4" },
              { prefix: "R4(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "R4(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "R4(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "R4(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - Object Tracking (Feltolerans)",
            items: [
              { prefix: "R4(config)#", target: "track 1 interface gigabitEthernet 0/0 line-protocol", label: "Övervaka routad port mot DS2" },
              { prefix: "R4(config)#", target: "interface gigabitEthernet 0/0", label: "Konfigurera port mot DS2" },
              { prefix: "R4(config-if)#", target: "description Routed-link to DS2", label: "Beskrivning" },
              { prefix: "R4(config-if)#", target: "ip address 10.1.4.2 255.255.255.252", label: "IP mot DS2 (/30)" },
              { prefix: "R4(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R4(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - HSRP Gateway redundans",
            items: [
              { prefix: "R4(config)#", target: "interface gigabitEthernet 0/1", label: "Konfigurera serverlänk Gi0/1" },
              { prefix: "R4(config-if)#", target: "description HSRP-link", label: "Beskrivning" },
              { prefix: "R4(config-if)#", target: "ip address 10.32.1.3 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "R4(config-if)#", target: "standby 10 ip 10.32.1.1", label: "Virtuell gateway IP" },
              { prefix: "R4(config-if)#", target: "standby 10 priority 100", label: "HSRP prioritet 100 (Standby)" },
              { prefix: "R4(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "R4(config-if)#", target: "standby 10 track 1 decrement 20", label: "Sänk prio med 20 vid länkfel" },
              { prefix: "R4(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R4(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 4 - Routing med OSPF",
            items: [
              { prefix: "R4(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "R4(config-router)#", target: "router-id 4.4.4.4", label: "Sätt Router-ID 4.4.4.4" },
              { prefix: "R4(config-router)#", target: "network 10.1.4.0 0.0.0.3 area 0", label: "Annonsera länk mot DS2" },
              { prefix: "R4(config-router)#", target: "network 10.32.1.0 0.0.0.255 area 0", label: "Annonsera servernätverk" },
              { prefix: "R4(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "R4(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "R4#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      }
    }
  },

  labb7: {
    id: "labb7",
    title: "Labb 7: Redundansteknik samverkan",
    url: "https://administration-utrustning.diginto.se/fhrp-koncepten/labb-7-redundansteknik-samverkan/",
    badge: "Redundansteknik Samverkan",
    devices: {
      s1: {
        id: "s1",
        name: "S1 (Access-switch)",
        role: "Access-lager • VLAN DATA10 & DATA20 • Rapid-PVST+ • Trunk",
        roleBadge: "Access Switch",
        contextTitle: "S1 Konfiguration & Nätverksroll",
        note: "Access-switch med VLAN 10 (DATA10) och VLAN 20 (DATA20). Portfast & BPDU Guard på Fa0/1 (VLAN 10). Trunk till DS1 & DS2 på Gi0/1-2.",
        params: [
          { key: "VLAN 10", val: "DATA10 (Fa0/1 - Access)" },
          { key: "VLAN 20", val: "DATA20" },
          { key: "STP-läge", val: "spanning-tree mode rapid-pvst" },
          { key: "Portskydd", val: "spanning-tree portfast, bpduguard enable" },
          { key: "Trunk-portar", val: "Gi0/1-2 allowed vlan 10,20" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "S1>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "S1#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "S1(config)#", target: "hostname S1", label: "Sätt hostname S1" },
              { prefix: "S1(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "S1(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "S1(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "S1(config-line)#", target: "exit", label: "Lämna line" }
            ]
          },
          {
            title: "Steg 2 - VLAN och Accessport-konfiguration",
            items: [
              { prefix: "S1(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "S1(config-vlan)#", target: "name DATA10", label: "Namnge VLAN 10 DATA10" },
              { prefix: "S1(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "S1(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "S1(config-vlan)#", target: "name DATA20", label: "Namnge VLAN 20 DATA20" },
              { prefix: "S1(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "S1(config)#", target: "interface fastEthernet 0/1", label: "Port Fa0/1 för klienter" },
              { prefix: "S1(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S1(config-if)#", target: "switchport access vlan 10", label: "Koppla till VLAN 10" },
              { prefix: "S1(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S1(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - Trunk-konfiguration",
            items: [
              { prefix: "S1(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "S1(config)#", target: "interface range gigabitEthernet 0/1-2", label: "Välj trunk-länkar Gi0/1-2" },
              { prefix: "S1(config-if-range)#", target: "description Trunk to DS1 and DS2", label: "Beskrivning för trunk" },
              { prefix: "S1(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "S1(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "S1(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "S1(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "S1(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "S1#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      s2: {
        id: "s2",
        name: "S2 (Access-switch)",
        role: "Access-lager • VLAN DATA10 & DATA20 • Rapid-PVST+ • Trunk",
        roleBadge: "Access Switch",
        contextTitle: "S2 Konfiguration & Nätverksroll",
        note: "Access-switch med VLAN 10 (DATA10) och VLAN 20 (DATA20). Portfast & BPDU Guard på Fa0/1 (VLAN 20). Trunk till DS1 & DS2 på Gi0/1-2.",
        params: [
          { key: "VLAN 10", val: "DATA10" },
          { key: "VLAN 20", val: "DATA20 (Fa0/1 - Access)" },
          { key: "STP-läge", val: "spanning-tree mode rapid-pvst" },
          { key: "Portskydd", val: "spanning-tree portfast, bpduguard enable" },
          { key: "Trunk-portar", val: "Gi0/1-2 allowed vlan 10,20" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "S2>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "S2#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "S2(config)#", target: "hostname S2", label: "Sätt hostname S2" },
              { prefix: "S2(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "S2(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "S2(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "S2(config-line)#", target: "exit", label: "Lämna line" }
            ]
          },
          {
            title: "Steg 2 - VLAN och Accessport-konfiguration",
            items: [
              { prefix: "S2(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "S2(config-vlan)#", target: "name DATA10", label: "Namnge VLAN 10 DATA10" },
              { prefix: "S2(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "S2(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "S2(config-vlan)#", target: "name DATA20", label: "Namnge VLAN 20 DATA20" },
              { prefix: "S2(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "S2(config)#", target: "interface fastEthernet 0/1", label: "Port Fa0/1 för personal" },
              { prefix: "S2(config-if)#", target: "switchport mode access", label: "Sätt access-läge" },
              { prefix: "S2(config-if)#", target: "switchport access vlan 20", label: "Koppla till VLAN 20" },
              { prefix: "S2(config-if)#", target: "spanning-tree portfast", label: "Aktivera PortFast" },
              { prefix: "S2(config-if)#", target: "spanning-tree bpduguard enable", label: "Aktivera BPDU Guard" },
              { prefix: "S2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - Trunk-konfiguration",
            items: [
              { prefix: "S2(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "S2(config)#", target: "interface range gigabitEthernet 0/1-2", label: "Välj trunk-länkar Gi0/1-2" },
              { prefix: "S2(config-if-range)#", target: "description Trunk to DS1 and DS2", label: "Beskrivning för trunk" },
              { prefix: "S2(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "S2(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10 och 20" },
              { prefix: "S2(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "S2(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "S2(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "S2#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      ds1: {
        id: "ds1",
        name: "DS1 (Distributionsswitch)",
        role: "Root Prim V10 • HSRP Active V10 (110) • LACP • Interface Tracking Gi1/0/5 • OSPF",
        roleBadge: "Root Prim V10 • HSRP 110/90",
        contextTitle: "DS1 Konfiguration & Nätverksroll",
        note: "DS1 är STP Root Bridge för VLAN 10 och standby för VLAN 20. HSRP Active för VLAN 10 (Prio 110, Preempt) och Standby för VLAN 20 (Prio 90, Preempt). Har HSRP Interface Tracking på Gi1/0/5 (-25 prio) samt OSPF Area 0.",
        params: [
          { key: "STP Roller", val: "VLAN 10 root primary, VLAN 20 root secondary" },
          { key: "EtherChannel", val: "Gi1/0/3-4 -> port-channel 1 (mode active LACP)" },
          { key: "Trunks Access", val: "Gi1/0/1 (S1), Gi1/0/2 (S2) allowed 10,20" },
          { key: "HSRP VLAN 10", val: "172.8.10.2 | VIP 172.8.10.1 | Prio 110 | Preempt | Track Gi1/0/5" },
          { key: "HSRP VLAN 20", val: "172.9.20.2 | VIP 172.9.20.1 | Prio 90 | Preempt | Track Gi1/0/5 25" },
          { key: "Routad länk R1", val: "Gi1/0/5: 152.8.26.1 /30 (no switchport)" },
          { key: "OSPF", val: "router ospf 1, RID 1.1.1.1, Passiva vlan 10/20, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "DS1>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "DS1#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "DS1(config)#", target: "hostname DS1", label: "Sätt hostname DS1" },
              { prefix: "DS1(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "DS1(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "DS1(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "DS1(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - VLAN-konfiguration",
            items: [
              { prefix: "DS1(config)#", target: "ip routing", label: "Aktivera routing" },
              { prefix: "DS1(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "DS1(config-vlan)#", target: "name DATA10", label: "Namnge VLAN 10 DATA10" },
              { prefix: "DS1(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "DS1(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "DS1(config-vlan)#", target: "name DATA20", label: "Namnge VLAN 20 DATA20" },
              { prefix: "DS1(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "DS1(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "DS1(config)#", target: "spanning-tree vlan 10 root primary", label: "Root primary för VLAN 10" },
              { prefix: "DS1(config)#", target: "spanning-tree vlan 20 root secondary", label: "Root secondary för VLAN 20" }
            ]
          },
          {
            title: "Steg 3 - EtherChannel till DS2",
            items: [
              { prefix: "DS1(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj Gi1/0/3-4 mot DS2" },
              { prefix: "DS1(config-if-range)#", target: "description Trunk-link to DS2 LACP", label: "Beskrivning LACP" },
              { prefix: "DS1(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS1(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS1(config-if-range)#", target: "channel-group 1 mode active", label: "Skapa port-channel 1 (LACP active)" },
              { prefix: "DS1(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "DS1(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "DS1(config)#", target: "interface port-channel 1", label: "Konfigurera port-channel 1" },
              { prefix: "DS1(config)#", target: "description etherChannel till DS2", label: "Beskrivning för port-channel 1" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt port-channel som trunk" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20 på port-channel" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Aktivera port-channel 1" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna port-channel" }
            ]
          },
          {
            title: "Steg 4 - Trunk-länkar till Access-switchar",
            items: [
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/1", label: "Konfigurera port mot S1" },
              { prefix: "DS1(config-if)#", target: "description Trunk-link to S1", label: "Beskrivning" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/2", label: "Konfigurera port mot S2" },
              { prefix: "DS1(config-if)#", target: "description Trunk-link to S2", label: "Beskrivning" },
              { prefix: "DS1(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS1(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 5 - HSRP Gateway redundans",
            items: [
              { prefix: "DS1(config)#", target: "interface Vlan 10", label: "Konfigurera SVI VLAN 10" },
              { prefix: "DS1(config-if)#", target: "ip address 172.8.10.2 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "DS1(config-if)#", target: "standby 10 ip 172.8.10.1", label: "Virtuell gateway IP (Grupp 10)" },
              { prefix: "DS1(config-if)#", target: "standby 10 priority 110", label: "HSRP prioritet 110 (Aktiv)" },
              { prefix: "DS1(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta SVI" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface Vlan 20", label: "Konfigurera SVI VLAN 20" },
              { prefix: "DS1(config-if)#", target: "ip address 172.9.20.2 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "DS1(config-if)#", target: "standby 20 ip 172.9.20.1", label: "Virtuell gateway IP (Grupp 20)" },
              { prefix: "DS1(config-if)#", target: "standby 20 priority 90", label: "HSRP prioritet 90 (Standby)" },
              { prefix: "DS1(config-if)#", target: "standby 20 preempt", label: "Aktivera Preemption" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta SVI" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 6 - Länk till R1",
            items: [
              { prefix: "DS1(config)#", target: "interface gigabitEthernet 1/0/5", label: "Konfigurera upplänk mot R1" },
              { prefix: "DS1(config-if)#", target: "description Routad uplink till R1", label: "Beskrivning" },
              { prefix: "DS1(config-if)#", target: "no switchport", label: "Gör till routad port" },
              { prefix: "DS1(config-if)#", target: "ip address 152.8.26.1 255.255.255.252", label: "IP mot R1 (/30)" },
              { prefix: "DS1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 7 - Routing med OSPF",
            items: [
              { prefix: "DS1(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "DS1(config-router)#", target: "router-id 1.1.1.1", label: "Sätt Router-ID 1.1.1.1" },
              { prefix: "DS1(config-router)#", target: "passive-interface vlan 10", label: "Passivt gränssnitt VLAN 10" },
              { prefix: "DS1(config-router)#", target: "passive-interface vlan 20", label: "Passivt gränssnitt VLAN 20" },
              { prefix: "DS1(config-router)#", target: "network 152.8.26.0 0.0.0.3 area 0", label: "Annonsera länk mot R1" },
              { prefix: "DS1(config-router)#", target: "network 172.8.10.0 0.0.0.255 area 0", label: "Annonsera VLAN 10" },
              { prefix: "DS1(config-router)#", target: "network 172.9.20.0 0.0.0.255 area 0", label: "Annonsera VLAN 20" },
              { prefix: "DS1(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "DS1(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "DS1#", target: "write memory", label: "Spara konfigurationen" }
            ]
          },
          {
            title: "Steg 8 - HSRP Tracking",
            items: [
              { prefix: "DS1#", target: "configure terminal", label: "Gå till konfigurationsläge" },
              { prefix: "DS1(config)#", target: "interface vlan 10", label: "Välj VLAN 10" },
              { prefix: "DS1(config-if)#", target: "standby 10 track gigabitEthernet 1/0/5", label: "Övervaka upplänk Gi1/0/5 (default -10)" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "interface vlan 20", label: "Välj VLAN 20" },
              { prefix: "DS1(config-if)#", target: "standby 20 track gigabitEthernet 1/0/5 25", label: "Övervaka Gi1/0/5 med decrement 25" },
              { prefix: "DS1(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS1(config)#", target: "end", label: "Avsluta konfiguration" }
            ]
          }
        ]
      },

      ds2: {
        id: "ds2",
        name: "DS2 (Distributionsswitch)",
        role: "Root Prim V20 • HSRP Active V20 (110) • LACP • Interface Tracking Gi1/0/5 • OSPF",
        roleBadge: "Root Prim V20 • HSRP 90/110",
        contextTitle: "DS2 Konfiguration & Nätverksroll",
        note: "DS2 är STP Root Bridge för VLAN 20 och standby för VLAN 10. HSRP Standby för VLAN 10 (Prio 90, Preempt) och Active för VLAN 20 (Prio 110, Preempt). Har HSRP Interface Tracking på Gi1/0/5 samt OSPF Area 0.",
        params: [
          { key: "STP Roller", val: "VLAN 10 root secondary, VLAN 20 root primary" },
          { key: "EtherChannel", val: "Gi1/0/3-4 -> port-channel 1 (mode active LACP)" },
          { key: "Trunks Access", val: "Gi1/0/1 (S2), Gi1/0/2 (S1) allowed 10,20" },
          { key: "HSRP VLAN 10", val: "172.8.10.3 | VIP 172.8.10.1 | Prio 90 | Preempt | Track Gi1/0/5" },
          { key: "HSRP VLAN 20", val: "172.9.20.3 | VIP 172.9.20.1 | Prio 110 | Preempt | Track Gi1/0/5" },
          { key: "Routad länk R3", val: "Gi1/0/5: 152.9.26.1 /30 (no switchport)" },
          { key: "OSPF", val: "router ospf 1, RID 2.2.2.2, Passiva vlan 10/20, Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "DS2>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "DS2#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "DS2(config)#", target: "hostname DS2", label: "Sätt hostname DS2" },
              { prefix: "DS2(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "DS2(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "DS2(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "DS2(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - VLAN-konfiguration",
            items: [
              { prefix: "DS2(config)#", target: "ip routing", label: "Aktivera routing" },
              { prefix: "DS2(config)#", target: "vlan 10", label: "Skapa VLAN 10" },
              { prefix: "DS2(config-vlan)#", target: "name DATA10", label: "Namnge VLAN 10 DATA10" },
              { prefix: "DS2(config-vlan)#", target: "exit", label: "Lämna VLAN 10" },
              { prefix: "DS2(config)#", target: "vlan 20", label: "Skapa VLAN 20" },
              { prefix: "DS2(config-vlan)#", target: "name DATA20", label: "Namnge VLAN 20 DATA20" },
              { prefix: "DS2(config-vlan)#", target: "exit", label: "Lämna VLAN 20" },
              { prefix: "DS2(config)#", target: "spanning-tree mode rapid-pvst", label: "Aktivera Rapid-PVST+" },
              { prefix: "DS2(config)#", target: "spanning-tree vlan 10 root secondary", label: "Root secondary för VLAN 10" },
              { prefix: "DS2(config)#", target: "spanning-tree vlan 20 root primary", label: "Root primary för VLAN 20" }
            ]
          },
          {
            title: "Steg 3 - EtherChannel till DS1",
            items: [
              { prefix: "DS2(config)#", target: "interface range gigabitEthernet 1/0/3-4", label: "Välj Gi1/0/3-4 mot DS1" },
              { prefix: "DS2(config-if-range)#", target: "description Trunk-link to DS1 LACP", label: "Beskrivning LACP" },
              { prefix: "DS2(config-if-range)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS2(config-if-range)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS2(config-if-range)#", target: "channel-group 1 mode active", label: "Skapa port-channel 1 (LACP active)" },
              { prefix: "DS2(config-if-range)#", target: "no shutdown", label: "Starta portarna" },
              { prefix: "DS2(config-if-range)#", target: "exit", label: "Lämna range" },
              { prefix: "DS2(config)#", target: "interface port-channel 1", label: "Konfigurera port-channel 1" },
              { prefix: "DS2(config)#", target: "description etherChannel till DS1", label: "Beskrivning för port-channel 1" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt port-channel som trunk" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20 på port-channel" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Aktivera port-channel 1" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna port-channel" }
            ]
          },
          {
            title: "Steg 4 - Trunk-länkar till Access-switchar",
            items: [
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/1", label: "Konfigurera port mot S2" },
              { prefix: "DS2(config-if)#", target: "description Trunk-link to S2", label: "Beskrivning" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/2", label: "Konfigurera port mot S1" },
              { prefix: "DS2(config-if)#", target: "description Trunk-link to S1", label: "Beskrivning" },
              { prefix: "DS2(config-if)#", target: "switchport mode trunk", label: "Sätt trunk-läge" },
              { prefix: "DS2(config-if)#", target: "switchport trunk allowed vlan 10,20", label: "Tillåt VLAN 10,20" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 5 - HSRP Gateway redundans",
            items: [
              { prefix: "DS2(config)#", target: "interface Vlan 10", label: "Konfigurera SVI VLAN 10" },
              { prefix: "DS2(config-if)#", target: "ip address 172.8.10.3 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "DS2(config-if)#", target: "standby 10 ip 172.8.10.1", label: "Virtuell gateway IP (Grupp 10)" },
              { prefix: "DS2(config-if)#", target: "standby 10 priority 90", label: "HSRP prioritet 90 (Standby)" },
              { prefix: "DS2(config-if)#", target: "standby 10 preempt", label: "Aktivera Preemption" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta SVI" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface Vlan 20", label: "Konfigurera SVI VLAN 20" },
              { prefix: "DS2(config-if)#", target: "ip address 172.9.20.3 255.255.255.0", label: "Fysisk IP-adress" },
              { prefix: "DS2(config-if)#", target: "standby 20 ip 172.9.20.1", label: "Virtuell gateway IP (Grupp 20)" },
              { prefix: "DS2(config-if)#", target: "standby 20 priority 110", label: "HSRP prioritet 110 (Aktiv)" },
              { prefix: "DS2(config-if)#", target: "standby 20 preempt", label: "Aktivera Preemption" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta SVI" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 6 - Länk till R3",
            items: [
              { prefix: "DS2(config)#", target: "interface gigabitEthernet 1/0/5", label: "Konfigurera upplänk mot R3" },
              { prefix: "DS2(config-if)#", target: "description Routad uplink till R3", label: "Beskrivning" },
              { prefix: "DS2(config-if)#", target: "no switchport", label: "Gör till routad port" },
              { prefix: "DS2(config-if)#", target: "ip address 152.9.26.1 255.255.255.252", label: "IP mot R3 (/30)" },
              { prefix: "DS2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 7 - Routing med OSPF",
            items: [
              { prefix: "DS2(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "DS2(config-router)#", target: "router-id 2.2.2.2", label: "Sätt Router-ID 2.2.2.2" },
              { prefix: "DS2(config-router)#", target: "passive-interface vlan 10", label: "Passivt gränssnitt VLAN 10" },
              { prefix: "DS2(config-router)#", target: "passive-interface vlan 20", label: "Passivt gränssnitt VLAN 20" },
              { prefix: "DS2(config-router)#", target: "network 152.9.26.0 0.0.0.3 area 0", label: "Annonsera länk mot R3" },
              { prefix: "DS2(config-router)#", target: "network 172.8.10.0 0.0.0.255 area 0", label: "Annonsera VLAN 10" },
              { prefix: "DS2(config-router)#", target: "network 172.9.20.0 0.0.0.255 area 0", label: "Annonsera VLAN 20" },
              { prefix: "DS2(config-router)#", target: "exit", label: "Lämna router config" },
              { prefix: "DS2(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "DS2#", target: "write memory", label: "Spara konfigurationen" }
            ]
          },
          {
            title: "Steg 8 - HSRP Tracking",
            items: [
              { prefix: "DS2#", target: "configure terminal", label: "Gå till konfigurationsläge" },
              { prefix: "DS2(config)#", target: "interface vlan 10", label: "Välj VLAN 10" },
              { prefix: "DS2(config-if)#", target: "standby 10 track gigabitEthernet 1/0/5", label: "Övervaka upplänk Gi1/0/5" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "interface vlan 20", label: "Välj VLAN 20" },
              { prefix: "DS2(config-if)#", target: "standby 20 track gigabitEthernet 1/0/5", label: "Övervaka upplänk Gi1/0/5" },
              { prefix: "DS2(config-if)#", target: "exit", label: "Lämna interface" },
              { prefix: "DS2(config)#", target: "end", label: "Avsluta konfiguration" }
            ]
          }
        ]
      },

      r1: {
        id: "r1",
        name: "R1 (OSPF Router 1)",
        role: "Routing-lager • OSPF RID 11.11.11.11 • Länk till DS1 & WAN R2",
        roleBadge: "OSPF Router 1",
        contextTitle: "R1 Konfiguration & Nätverksroll",
        note: "Router R1 kopplar distributionsswitch DS1 till WAN-routern R2. Kör OSPF i Area 0 med Router ID 11.11.11.11.",
        params: [
          { key: "Länk till DS1", val: "Gi0/0: 152.8.26.2 /30" },
          { key: "WAN-länk till R2", val: "Gi0/1: 10.10.0.1 /30" },
          { key: "OSPF Process", val: "router ospf 1, RID 11.11.11.11" },
          { key: "OSPF Nätverk", val: "152.8.26.0/30 & 10.10.0.0/30 i Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "Router>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "Router#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "Router(config)#", target: "hostname R1", label: "Sätt hostname R1" },
              { prefix: "R1(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "R1(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "R1(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "R1(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - Länk till DS1",
            items: [
              { prefix: "R1(config)#", target: "interface gigabitEthernet 0/0", label: "Konfigurera Gi0/0 mot DS1" },
              { prefix: "R1(config-if)#", target: "description Länk till DS1", label: "Beskrivning" },
              { prefix: "R1(config-if)#", target: "ip address 152.8.26.2 255.255.255.252", label: "IP mot DS1 (/30)" },
              { prefix: "R1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - WAN-länk till R2",
            items: [
              { prefix: "R1(config)#", target: "interface gigabitEthernet 0/1", label: "Konfigurera Gi0/1 mot R2" },
              { prefix: "R1(config-if)#", target: "description WAN-länk till R2", label: "Beskrivning" },
              { prefix: "R1(config-if)#", target: "ip address 10.10.0.1 255.255.255.252", label: "IP mot R2 (/30)" },
              { prefix: "R1(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R1(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 4 - Routing med OSPF",
            items: [
              { prefix: "R1(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "R1(config-router)#", target: "router-id 11.11.11.11", label: "Sätt Router-ID 11.11.11.11" },
              { prefix: "R1(config-router)#", target: "network 152.8.26.0 0.0.0.3 area 0", label: "Annonsera länk mot DS1" },
              { prefix: "R1(config-router)#", target: "network 10.10.0.0 0.0.0.3 area 0", label: "Annonsera WAN-länk mot R2" },
              { prefix: "R1(config-router)#", target: "exit", label: "Lämna OSPF" },
              { prefix: "R1(config-router)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "R1#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      r2: {
        id: "r2",
        name: "R2 (Core WAN Router)",
        role: "WAN-lager • OSPF RID 22.22.22.22 • WAN R1 & R3 • Fjärrnät LAN 8",
        roleBadge: "Core WAN Router",
        contextTitle: "R2 Konfiguration & Nätverksroll",
        note: "Central WAN-router som binder samman R1 och R3 och agerar gateway till fjärrnätverket LAN 8 (8.8.8.0/28). Kör OSPF Area 0 med RID 22.22.22.22.",
        params: [
          { key: "WAN-länk till R1", val: "Gi0/0: 10.10.0.2 /30" },
          { key: "WAN-länk till R3", val: "Gi0/1: 10.20.0.1 /30" },
          { key: "LAN 8 Fjärrnät", val: "Gi0/2: 8.8.8.1 /28" },
          { key: "OSPF Process", val: "router ospf 1, RID 22.22.22.22" },
          { key: "OSPF Nätverk", val: "10.10.0.0/30, 10.20.0.0/30, 8.8.8.0/28 Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "Router>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "Router#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "Router(config)#", target: "hostname R2", label: "Sätt hostname R2" },
              { prefix: "R2(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "R2(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "R2(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "R2(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - WAN-länk till R1",
            items: [
              { prefix: "R2(config)#", target: "interface gigabitEthernet 0/0", label: "Konfigurera Gi0/0 mot R1" },
              { prefix: "R2(config-if)#", target: "description WAN-länk till R1", label: "Beskrivning" },
              { prefix: "R2(config-if)#", target: "ip address 10.10.0.2 255.255.255.252", label: "IP mot R1 (/30)" },
              { prefix: "R2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - WAN-länk till R3",
            items: [
              { prefix: "R2(config)#", target: "interface gigabitEthernet 0/1", label: "Konfigurera Gi0/1 mot R3" },
              { prefix: "R2(config-if)#", target: "description WAN-länk till R3", label: "Beskrivning" },
              { prefix: "R2(config-if)#", target: "ip address 10.20.0.1 255.255.255.252", label: "IP mot R3 (/30)" },
              { prefix: "R2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 4 - LAN 8 Länk",
            items: [
              { prefix: "R2(config)#", target: "interface gigabitEthernet 0/2", label: "Konfigurera Gi0/2 för LAN 8" },
              { prefix: "R2(config-if)#", target: "description Link to LAN 8", label: "Beskrivning" },
              { prefix: "R2(config-if)#", target: "ip address 8.8.8.1 255.255.255.240", label: "IP för LAN 8 (/28)" },
              { prefix: "R2(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R2(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 5 - Routing med OSPF",
            items: [
              { prefix: "R2(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "R2(config-router)#", target: "router-id 22.22.22.22", label: "Sätt Router-ID 22.22.22.22" },
              { prefix: "R2(config-router)#", target: "network 10.10.0.0 0.0.0.3 area 0", label: "Annonsera WAN mot R1" },
              { prefix: "R2(config-router)#", target: "network 10.20.0.0 0.0.0.3 area 0", label: "Annonsera WAN mot R3" },
              { prefix: "R2(config-router)#", target: "network 8.8.8.0 0.0.0.15 area 0", label: "Annonsera LAN 8 nätverk" },
              { prefix: "R2(config-router)#", target: "exit", label: "Lämna OSPF" },
              { prefix: "R2(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "R2#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      },

      r3: {
        id: "r3",
        name: "R3 (OSPF Router 3)",
        role: "Routing-lager • OSPF RID 33.33.33.33 • Länk till DS2 & WAN R2",
        roleBadge: "OSPF Router 3",
        contextTitle: "R3 Konfiguration & Nätverksroll",
        note: "Router R3 kopplar distributionsswitch DS2 till WAN-routern R2. Kör OSPF i Area 0 med Router ID 33.33.33.33.",
        params: [
          { key: "Länk till DS2", val: "Gi0/0: 152.9.26.2 /30" },
          { key: "WAN-länk till R2", val: "Gi0/1: 10.20.0.2 /30" },
          { key: "OSPF Process", val: "router ospf 1, RID 33.33.33.33" },
          { key: "OSPF Nätverk", val: "152.9.26.0/30 & 10.20.0.0/30 i Area 0" }
        ],
        steps: [
          {
            title: "Steg 1 - Grundkonfiguration",
            items: [
              { prefix: "Router>", target: "enable", label: "Aktivera EXEC-läge" },
              { prefix: "Router#", target: "configure terminal", label: "Gå till konfiguration" },
              { prefix: "Router(config)#", target: "hostname R3", label: "Sätt hostname R3" },
              { prefix: "R3(config)#", target: "no ip domain-lookup", label: "Inaktivera DNS-uppslag" },
              { prefix: "R3(config)#", target: "line console 0", label: "Konsollinje 0" },
              { prefix: "R3(config-line)#", target: "logging synchronous", label: "Synkron loggning" },
              { prefix: "R3(config-line)#", target: "exit", label: "Lämna line console" }
            ]
          },
          {
            title: "Steg 2 - Länk till DS2",
            items: [
              { prefix: "R3(config)#", target: "interface gigabitEthernet 0/0", label: "Konfigurera Gi0/0 mot DS2" },
              { prefix: "R3(config-if)#", target: "description Länk till DS2", label: "Beskrivning" },
              { prefix: "R3(config-if)#", target: "ip address 152.9.26.2 255.255.255.252", label: "IP mot DS2 (/30)" },
              { prefix: "R3(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R3(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 3 - WAN-länk till R2",
            items: [
              { prefix: "R3(config)#", target: "interface gigabitEthernet 0/1", label: "Konfigurera Gi0/1 mot R2" },
              { prefix: "R3(config-if)#", target: "description WAN-länk till R2", label: "Beskrivning" },
              { prefix: "R3(config-if)#", target: "ip address 10.20.0.2 255.255.255.252", label: "IP mot R2 (/30)" },
              { prefix: "R3(config-if)#", target: "no shutdown", label: "Starta porten" },
              { prefix: "R3(config-if)#", target: "exit", label: "Lämna interface" }
            ]
          },
          {
            title: "Steg 4 - Routing med OSPF",
            items: [
              { prefix: "R3(config)#", target: "router ospf 1", label: "Starta OSPF process 1" },
              { prefix: "R3(config-router)#", target: "router-id 33.33.33.33", label: "Sätt Router-ID 33.33.33.33" },
              { prefix: "R3(config-router)#", target: "network 152.9.26.0 0.0.0.3 area 0", label: "Annonsera länk mot DS2" },
              { prefix: "R3(config-router)#", target: "network 10.20.0.0 0.0.0.3 area 0", label: "Annonsera WAN-länk mot R2" },
              { prefix: "R3(config-router)#", target: "exit", label: "Lämna OSPF" },
              { prefix: "R3(config)#", target: "end", label: "Avsluta till privileged EXEC" },
              { prefix: "R3#", target: "write memory", label: "Spara konfigurationen" }
            ]
          }
        ]
      }
    }
  }
};

// Process each device to automatically create fullSolution and guidedItems
for (const labKey in LAB_CONFIGS) {
  const lab = LAB_CONFIGS[labKey];
  for (const devKey in lab.devices) {
    const dev = lab.devices[devKey];
    let solLines = [];
    let guided = [];
    dev.steps.forEach(st => {
      solLines.push(`! ${st.title}`);
      st.items.forEach(it => {
        solLines.push(`${it.prefix}${it.target}`);
        guided.push({
          prefix: it.prefix,
          target: it.target,
          label: it.label,
          stepTitle: st.title
        });
      });
    });
    dev.fullSolution = solLines.join("\n");
    dev.guidedItems = guided;
  }
}

// Backwards compatibility alias
const CONFIG_MODELS = LAB_CONFIGS.labb6.devices;

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
    items: [],
    completedIds: new Set(),
    userAnswers: {}
  },
  // Configs
  config: {
    currentLab: "labb6",
    currentDevice: "ds1",
    mode: "guided",
    savedValues: {}
  },
  // Subnetting Trainer
  subnet: {
    currentTask: null,
    difficulty: "classC",
    solvedCount: 0,
    streak: 0
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
  initSubnetTrainer();
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
      ${pct >= 85 ? '🌟 Fantastiskt! Du är helt redo för provet på FHRP & HSRP!' : pct >= 60 ? '👍 Bra jobbat! Träna lite mer på detaljer som MAC-adresser och VRRP för full pott.' : '💪 Fortsätt öva! Kolla fliken "Snabbguide" och kör en ny omgång.'}
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
  if (cat === "mac-calc") return "MAC-beräkning & ARP";
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
// 8. CLI COMMANDS TRAINER (Tab 2: Card Grid Trainer)
// ==========================================
function initCommands() {
  state.commands.items = [...COMMANDS_DB];

  const shuffleBtn = document.getElementById("cmdShuffleBtn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => shuffleCommands());
  }

  const resetBtn = document.getElementById("cmdResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => resetCommands());
  }

  renderCommandCards();
}

function shuffleCommands() {
  sfx.playClick();
  for (let i = state.commands.items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.commands.items[i], state.commands.items[j]] = [state.commands.items[j], state.commands.items[i]];
  }
  renderCommandCards();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetCommands() {
  sfx.playClick();
  state.commands.completedIds.clear();
  state.commands.userAnswers = {};
  state.commands.items = [...COMMANDS_DB];
  renderCommandCards();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => {
    const firstInput = document.querySelector(".cmd-card-cli-input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  }, 100);
}

function renderCommandCards() {
  const container = document.getElementById("commandCardsGrid");
  if (!container) return;
  container.innerHTML = "";

  const counterBadge = document.getElementById("cmdGridCounter");
  if (counterBadge) {
    const total = state.commands.items.length;
    const done = state.commands.completedIds.size;
    counterBadge.textContent = `Klart: ${done} / ${total}`;
    if (done === total && total > 0) {
      counterBadge.style.borderColor = "var(--color-success)";
      counterBadge.style.color = "var(--color-success)";
    } else {
      counterBadge.style.borderColor = "";
      counterBadge.style.color = "";
    }
  }

  const victoryBanner = document.getElementById("cmdVictoryBanner");
  if (victoryBanner) {
    if (state.commands.completedIds.size === state.commands.items.length && state.commands.items.length > 0) {
      victoryBanner.style.display = "block";
    } else {
      victoryBanner.style.display = "none";
    }
  }

  state.commands.items.forEach((cmd) => {
    const isCompleted = state.commands.completedIds.has(cmd.id);
    const userVal = state.commands.userAnswers[cmd.id] || "";

    const card = document.createElement("div");
    card.className = `cmd-exercise-card ${isCompleted ? 'correct' : ''}`;
    card.id = `card-${cmd.id}`;

    let contextHtml = "";
    if (cmd.context) {
      contextHtml = `<div class="cmd-card-cli-context">${escapeHtml(cmd.context)}</div>`;
    }

    card.innerHTML = `
      <div class="cmd-card-header">
        <h4 class="cmd-card-title">${escapeHtml(cmd.title)}</h4>
        <p class="cmd-card-desc">${escapeHtml(cmd.desc)}</p>
      </div>

      <div class="cmd-card-cli">
        ${contextHtml}
        <div class="cmd-card-cli-row">
          <span class="cmd-card-cli-prompt">${escapeHtml(cmd.prompt)}</span>
          <input type="text" 
                 class="cmd-card-cli-input" 
                 id="input-${cmd.id}" 
                 data-id="${cmd.id}"
                 placeholder="skriv hela kommandot..." 
                 value="${escapeHtml(userVal)}"
                 ${isCompleted ? 'disabled' : ''}
                 autocomplete="off" 
                 spellcheck="false">
        </div>
      </div>

      <div class="cmd-card-footer">
        <button class="cmd-card-check-btn" 
                id="btn-${cmd.id}" 
                data-id="${cmd.id}"
                ${isCompleted ? 'disabled' : ''}>
          ${isCompleted ? '✓ Rätt!' : 'Kontrollera Svar'}
        </button>
      </div>

      <div class="cmd-card-feedback" id="feedback-${cmd.id}" style="${isCompleted ? 'display:block;' : 'display:none;'}">
        ${isCompleted ? '✓ Rätt! Syntax verifierad.' : ''}
      </div>
    `;

    const btn = card.querySelector(`#btn-${cmd.id}`);
    if (btn) {
      btn.addEventListener("click", () => checkCommandCard(cmd.id));
    }

    const input = card.querySelector(`#input-${cmd.id}`);
    if (input) {
      input.addEventListener("input", (e) => {
        state.commands.userAnswers[cmd.id] = e.target.value;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkCommandCard(cmd.id);
        }
      });
    }

    container.appendChild(card);
  });
}

function checkCommandCard(cmdId) {
  const cmd = state.commands.items.find(c => c.id === cmdId);
  if (!cmd) return;

  const input = document.getElementById(`input-${cmdId}`);
  const card = document.getElementById(`card-${cmdId}`);
  const btn = document.getElementById(`btn-${cmdId}`);
  const feedback = document.getElementById(`feedback-${cmdId}`);
  if (!input || !card) return;

  const val = input.value.trim();
  if (!val) {
    input.focus();
    return;
  }

  const isMatch = cmd.validRegex.test(val);

  if (isMatch) {
    sfx.playCorrect();
    state.commands.completedIds.add(cmd.id);
    state.commands.userAnswers[cmd.id] = val;

    card.classList.remove("wrong");
    card.classList.add("correct");

    input.disabled = true;
    if (btn) {
      btn.textContent = "✓ Rätt!";
      btn.disabled = true;
    }

    if (feedback) {
      feedback.className = "cmd-card-feedback correct";
      feedback.textContent = "✓ Rätt! Syntax verifierad.";
      feedback.style.display = "block";
    }

    const counterBadge = document.getElementById("cmdGridCounter");
    if (counterBadge) {
      counterBadge.textContent = `Klart: ${state.commands.completedIds.size} / ${state.commands.items.length}`;
    }

    if (state.commands.completedIds.size === state.commands.items.length) {
      sfx.playWin();
      const victoryBanner = document.getElementById("cmdVictoryBanner");
      if (victoryBanner) victoryBanner.style.display = "block";
    } else {
      const nextUncompleted = state.commands.items.find(c => !state.commands.completedIds.has(c.id));
      if (nextUncompleted) {
        const nextInput = document.getElementById(`input-${nextUncompleted.id}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  } else {
    sfx.playWrong();
    card.classList.remove("correct");
    card.classList.add("wrong");

    if (feedback) {
      feedback.className = "cmd-card-feedback wrong";
      feedback.innerHTML = `
        <span>❌ Felaktigt kommando</span>
        <button class="cmd-reveal-link" type="button" data-id="${cmd.id}">Visa svar</button>
      `;
      feedback.style.display = "flex";

      const revealBtn = feedback.querySelector(".cmd-reveal-link");
      if (revealBtn) {
        revealBtn.addEventListener("click", () => {
          input.value = cmd.canonical;
          state.commands.userAnswers[cmd.id] = cmd.canonical;
          input.focus();
        });
      }
    }
  }
}

// ==========================================
// 9. FULL CONFIGURATIONS WORKSPACE (Tab 3: Labb 6 & 7)
// ==========================================
function getCurrentDeviceModel() {
  const lab = LAB_CONFIGS[state.config.currentLab] || LAB_CONFIGS.labb6;
  return lab.devices[state.config.currentDevice] || Object.values(lab.devices)[0];
}

function initConfigWorkspace() {
  // Lab selector buttons (Labb 6 vs Labb 7)
  const labBtns = document.querySelectorAll("#labSelector .lab-btn");
  labBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedLab = btn.getAttribute("data-lab");
      if (selectedLab === state.config.currentLab) return;
      sfx.playClick();
      labBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.config.currentLab = selectedLab;

      // Default to first device or ds1 if exists
      const devices = Object.keys(LAB_CONFIGS[selectedLab].devices);
      state.config.currentDevice = devices.includes("ds1") ? "ds1" : devices[0];

      renderDevicePillSelector();
      loadDeviceConfiguration();
    });
  });

  // Editor mode tabs
  const writeTab = document.getElementById("editorWriteTab");
  const guidedTab = document.getElementById("editorGuidedTab");
  const solTab = document.getElementById("editorSolutionTab");

  if (writeTab) writeTab.addEventListener("click", () => setEditorMode("write"));
  if (guidedTab) guidedTab.addEventListener("click", () => setEditorMode("guided"));
  if (solTab) solTab.addEventListener("click", () => setEditorMode("solution"));

  // Editor tool buttons
  const fillAllBtn = document.getElementById("fillAllGuidedBtn");
  if (fillAllBtn) {
    fillAllBtn.addEventListener("click", () => {
      fillAllGuided();
    });
  }

  const loadTplBtn = document.getElementById("loadTemplateBtn");
  if (loadTplBtn) {
    loadTplBtn.addEventListener("click", () => {
      loadEditorTemplate();
    });
  }

  const clearBtn = document.getElementById("clearEditorBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      sfx.playClick();
      if (state.config.mode === "guided") {
        const inputs = document.querySelectorAll(".guided-input");
        inputs.forEach(inp => {
          inp.value = "";
          inp.classList.remove("correct", "wrong");
          const icon = inp.parentElement.querySelector(".guided-status-icon");
          if (icon) icon.textContent = "";
        });
        const dev = getCurrentDeviceModel();
        if (dev) {
          dev.steps.forEach((_, sIdx) => {
            const stepBadge = document.getElementById(`stepBadge_${sIdx}`);
            if (stepBadge) {
              stepBadge.classList.remove("complete");
              stepBadge.textContent = `Steg ${sIdx + 1}`;
            }
          });
        }
        updateGuidedProgressBar();
      } else {
        const textarea = document.getElementById("configCodeEditor");
        if (textarea) {
          textarea.value = "";
          updateLineNumbers();
        }
      }
    });
  }

  const copyBtn = document.getElementById("copySolutionBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const dev = getCurrentDeviceModel();
      if (dev && dev.fullSolution) {
        navigator.clipboard.writeText(dev.fullSolution);
        sfx.playClick();
        alert(`Facit för ${dev.name} kopierat till urklipp!`);
      }
    });
  }

  const checkGuidedBtn = document.getElementById("checkGuidedBtn");
  if (checkGuidedBtn) {
    checkGuidedBtn.addEventListener("click", () => {
      validateGuidedInputs();
    });
  }

  const showHintsBtn = document.getElementById("showHintsBtn");
  if (showHintsBtn) {
    showHintsBtn.addEventListener("click", () => {
      fillAllGuided();
    });
  }

  const validateCfgBtn = document.getElementById("validateConfigBtn");
  if (validateCfgBtn) {
    validateCfgBtn.addEventListener("click", () => {
      validateUserConfiguration();
    });
  }

  // Code editor textarea line numbers sync
  const textarea = document.getElementById("configCodeEditor");
  if (textarea) {
    textarea.addEventListener("input", updateLineNumbers);
    textarea.addEventListener("scroll", () => {
      const lineNumbersEl = document.getElementById("editorLineNumbers");
      if (lineNumbersEl) lineNumbersEl.scrollTop = textarea.scrollTop;
    });
  }

  // Mini diagram lightbox zoom
  const diagramWrap = document.getElementById("miniDiagramWrap");
  const lightboxModal = document.getElementById("topoLightboxModal");
  const lightboxClose = document.getElementById("topoLightboxClose");
  const lightboxImg = document.getElementById("topoLightboxImg");
  const lightboxTitle = document.getElementById("topoLightboxTitle");

  if (diagramWrap && lightboxModal) {
    diagramWrap.addEventListener("click", () => {
      sfx.playClick();
      const isLabb6 = state.config.currentLab === "labb6";
      if (lightboxImg) lightboxImg.src = isLabb6 ? "labb6_topologi.png" : "labb7_topologi.png";
      if (lightboxTitle) lightboxTitle.textContent = isLabb6 ? "Labb 6: Feltolerant Nätverk (Packet Tracer Topologi)" : "Labb 7: Redundansteknik Samverkan (Packet Tracer Topologi)";
      lightboxModal.style.display = "flex";
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", () => {
        lightboxModal.style.display = "none";
      });
    }

    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightboxModal.style.display === "flex") {
        lightboxModal.style.display = "none";
      }
    });
  }

  // Initial population
  renderDevicePillSelector();
  loadDeviceConfiguration();
}

function renderDevicePillSelector() {
  const container = document.getElementById("devicePillSelector");
  if (!container) return;
  container.innerHTML = "";

  const lab = LAB_CONFIGS[state.config.currentLab] || LAB_CONFIGS.labb6;
  const devKeys = Object.keys(lab.devices);

  devKeys.forEach(devKey => {
    const dev = lab.devices[devKey];
    const btn = document.createElement("button");
    btn.className = `device-btn ${devKey === state.config.currentDevice ? "active" : ""}`;
    btn.setAttribute("data-device", devKey);
    btn.innerHTML = `<span class="dev-name">${escapeHtml(dev.name)}</span> <span class="dev-role">${escapeHtml(dev.role)}</span>`;

    btn.addEventListener("click", () => {
      sfx.playClick();
      container.querySelectorAll(".device-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.config.currentDevice = devKey;
      loadDeviceConfiguration();
    });

    container.appendChild(btn);
  });
}

function setEditorMode(mode) {
  sfx.playClick();
  state.config.mode = mode;

  const writeTab = document.getElementById("editorWriteTab");
  const guidedTab = document.getElementById("editorGuidedTab");
  const solTab = document.getElementById("editorSolutionTab");

  if (writeTab) writeTab.classList.toggle("active", mode === "write");
  if (guidedTab) guidedTab.classList.toggle("active", mode === "guided");
  if (solTab) solTab.classList.toggle("active", mode === "solution");

  const textView = document.getElementById("editorTextView");
  const guidedView = document.getElementById("editorGuidedView");
  const solView = document.getElementById("editorSolutionView");
  const valDrawer = document.getElementById("validationDrawer");

  if (textView) textView.style.display = mode === "write" ? "block" : "none";
  if (guidedView) guidedView.style.display = mode === "guided" ? "block" : "none";
  if (solView) solView.style.display = mode === "solution" ? "block" : "none";
  if (valDrawer) valDrawer.style.display = "none";

  if (mode === "guided") {
    renderGuidedInputs();
  } else if (mode === "write") {
    updateLineNumbers();
  }
}

function loadDeviceConfiguration() {
  const lab = LAB_CONFIGS[state.config.currentLab] || LAB_CONFIGS.labb6;
  const dev = lab.devices[state.config.currentDevice] || Object.values(lab.devices)[0];
  if (!dev) return;

  const titleEl = document.getElementById("cfgContextTitle");
  if (titleEl) titleEl.textContent = `${dev.name} (${lab.title.split(":")[0]})`;

  const roleEl = document.getElementById("cfgRoleBadge");
  if (roleEl) roleEl.textContent = dev.role;

  const noteEl = document.getElementById("cfgImportantNote");
  if (noteEl) noteEl.textContent = dev.note;

  // Render parameters table
  const table = document.getElementById("cfgParamsTable");
  if (table) {
    table.innerHTML = "";
    (dev.params || []).forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(p.key)}</td><td>${escapeHtml(p.val)}</td>`;
      table.appendChild(tr);
    });
  }

  // Update Mini Topology SVG
  renderMiniTopology(state.config.currentLab, state.config.currentDevice);

  // Update Solution block
  const solBlock = document.getElementById("solutionCodeBlock");
  if (solBlock) solBlock.textContent = dev.fullSolution;

  // Update badge summary
  const summaryBadge = document.getElementById("guidedDevSummaryBadge");
  if (summaryBadge) {
    const totalCmds = dev.guidedItems ? dev.guidedItems.length : 0;
    summaryBadge.textContent = `${dev.steps.length} steg (${totalCmds} kommandon)`;
  }

  // Render guided inputs if guided mode
  if (state.config.mode === "guided") {
    renderGuidedInputs();
  }

  // Reset validation drawer
  const valDrawer = document.getElementById("validationDrawer");
  if (valDrawer) valDrawer.style.display = "none";
}

function updateLineNumbers() {
  const textarea = document.getElementById("configCodeEditor");
  if (!textarea) return;
  const lines = textarea.value.split("\n").length;
  const lineNumbersEl = document.getElementById("editorLineNumbers");
  if (lineNumbersEl) {
    lineNumbersEl.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");
  }
}

function loadEditorTemplate() {
  const dev = getCurrentDeviceModel();
  if (!dev) return;
  let template = `! Konfigurationsmall för ${dev.name}\n`;
  dev.steps.forEach(st => {
    template += `\n! ${st.title}\n`;
    if (st.items && st.items.length > 0) {
      template += `${st.items[0].target}\n! ...\n`;
    }
  });
  const textarea = document.getElementById("configCodeEditor");
  if (textarea) {
    textarea.value = template;
    updateLineNumbers();
  }
}

function renderGuidedInputs() {
  const dev = getCurrentDeviceModel();
  const container = document.getElementById("guidedInputsContainer");
  if (!container || !dev) return;
  container.innerHTML = "";

  let globalLine = 1;

  dev.steps.forEach((step, sIdx) => {
    const card = document.createElement("div");
    card.className = "guided-step-card";

    // Step Header
    const header = document.createElement("div");
    header.className = "guided-step-header";
    const cleanTitle = step.title.replace(/^Steg\s+\d+\s*[-:]\s*/i, "");
    header.innerHTML = `
      <div class="guided-step-title">
        <span class="step-badge" id="stepBadge_${sIdx}">Steg ${sIdx + 1}</span>
        <strong>${escapeHtml(cleanTitle)}</strong>
        <span class="step-item-count" style="font-size:0.75rem; color:var(--text-muted);">(${step.items.length} kommandon)</span>
      </div>
      <div class="guided-step-actions">
        <button class="step-action-btn step-hint-btn" data-step="${sIdx}" title="Fyll i facit för bara detta steg">💡 Fyll steg</button>
        <button class="step-action-btn step-check-btn" data-step="${sIdx}" title="Rätta bara detta steg">✓ Rätta steg</button>
      </div>
    `;

    // Step Body
    const body = document.createElement("div");
    body.className = "guided-step-body";
    body.id = `guidedStepBody_${sIdx}`;

    step.items.forEach((item, iIdx) => {
      const row = document.createElement("div");
      row.className = "guided-line-row";
      const lineNum = globalLine++;

      row.innerHTML = `
        <div class="guided-line-num">${lineNum}</div>
        <div class="guided-prompt-prefix" title="${escapeHtml(item.prefix)}">${escapeHtml(item.prefix)}</div>
        <div class="guided-input-wrap">
          <input type="text" class="guided-input" data-step="${sIdx}" data-idx="${iIdx}" data-target="${escapeHtml(item.target)}" placeholder="${escapeHtml(item.label)}" autocomplete="off" spellcheck="false">
          <span class="guided-status-icon"></span>
        </div>
        <button class="guided-line-hint-btn" title="Visa ledtråd / facit för denna rad">💡</button>
      `;

      const input = row.querySelector(".guided-input");
      const icon = row.querySelector(".guided-status-icon");
      const hintBtn = row.querySelector(".guided-line-hint-btn");

      // Auto check on blur or keydown Enter
      input.addEventListener("input", () => {
        input.classList.remove("correct", "wrong");
        icon.textContent = "";
        updateGuidedProgressBar();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkSingleInput(input);
          // Focus next input in the entire list
          const allInputs = Array.from(document.querySelectorAll(".guided-input"));
          const currIdx = allInputs.indexOf(input);
          if (currIdx > -1 && currIdx < allInputs.length - 1) {
            allInputs[currIdx + 1].focus();
          } else {
            // Reached last input, validate all!
            validateGuidedInputs();
          }
        }
      });

      hintBtn.addEventListener("click", () => {
        sfx.playClick();
        input.value = item.target;
        checkSingleInput(input);
        updateGuidedProgressBar();
      });

      body.appendChild(row);
    });

    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);

    // Header buttons event listeners
    const stepHintBtn = header.querySelector(".step-hint-btn");
    stepHintBtn.addEventListener("click", () => {
      fillStep(sIdx);
    });

    const stepCheckBtn = header.querySelector(".step-check-btn");
    stepCheckBtn.addEventListener("click", () => {
      validateStep(sIdx);
    });
  });

  updateGuidedProgressBar();
}

function checkSingleInput(input) {
  const target = input.getAttribute("data-target") || "";
  const icon = input.parentElement.querySelector(".guided-status-icon");
  const actual = input.value.trim();

  if (!actual) {
    input.classList.remove("correct", "wrong");
    if (icon) icon.textContent = "";
    return false;
  }

  if (isLooseCommandMatch(actual, target)) {
    input.classList.remove("wrong");
    input.classList.add("correct");
    if (icon) {
      icon.textContent = "✓";
      icon.style.color = "var(--color-success)";
    }
    sfx.playCorrect();
    return true;
  } else {
    input.classList.remove("correct");
    input.classList.add("wrong");
    if (icon) {
      icon.textContent = "✕";
      icon.style.color = "var(--primary-red)";
    }
    sfx.playWrong();
    return false;
  }
}

function validateStep(stepIndex) {
  const inputs = document.querySelectorAll(`.guided-input[data-step="${stepIndex}"]`);
  let correct = 0;
  inputs.forEach(input => {
    if (checkSingleInput(input)) {
      correct++;
    }
  });

  const stepBadge = document.getElementById(`stepBadge_${stepIndex}`);
  if (stepBadge) {
    if (correct === inputs.length) {
      stepBadge.classList.add("complete");
      stepBadge.textContent = `Steg ${stepIndex + 1} ✓`;
    } else {
      stepBadge.classList.remove("complete");
      stepBadge.textContent = `Steg ${stepIndex + 1} (${correct}/${inputs.length})`;
    }
  }

  updateGuidedProgressBar();

  if (correct === inputs.length) {
    sfx.playWin();
  }
}

function fillStep(stepIndex) {
  sfx.playClick();
  const inputs = document.querySelectorAll(`.guided-input[data-step="${stepIndex}"]`);
  inputs.forEach(input => {
    input.value = input.getAttribute("data-target");
    checkSingleInput(input);
  });
  const stepBadge = document.getElementById(`stepBadge_${stepIndex}`);
  if (stepBadge) {
    stepBadge.classList.add("complete");
    stepBadge.textContent = `Steg ${stepIndex + 1} ✓`;
  }
  updateGuidedProgressBar();
}

function updateGuidedProgressBar() {
  const inputs = document.querySelectorAll(".guided-input");
  const total = inputs.length;
  if (total === 0) return;

  let filled = 0;
  let correct = 0;
  inputs.forEach(inp => {
    if (inp.value.trim().length > 0) filled++;
    if (inp.classList.contains("correct")) correct++;
  });

  const progressText = document.getElementById("guidedProgressText");
  const progressBarFill = document.getElementById("guidedProgressBarFill");

  if (progressText) {
    progressText.textContent = `${correct} av ${total} rätt (${filled} ifyllda)`;
  }
  if (progressBarFill) {
    const pct = Math.round((correct / total) * 100);
    progressBarFill.style.width = `${pct}%`;
  }
}

function validateGuidedInputs() {
  const dev = getCurrentDeviceModel();
  if (!dev) return;

  const inputs = document.querySelectorAll(".guided-input");
  let correctCount = 0;

  inputs.forEach(input => {
    if (checkSingleInput(input)) {
      correctCount++;
    }
  });

  // Update step badges
  dev.steps.forEach((step, sIdx) => {
    const stepInputs = document.querySelectorAll(`.guided-input[data-step="${sIdx}"]`);
    let stepCorrect = 0;
    stepInputs.forEach(inp => {
      if (inp.classList.contains("correct")) stepCorrect++;
    });
    const stepBadge = document.getElementById(`stepBadge_${sIdx}`);
    if (stepBadge) {
      if (stepCorrect === stepInputs.length) {
        stepBadge.classList.add("complete");
        stepBadge.textContent = `Steg ${sIdx + 1} ✓`;
      } else {
        stepBadge.classList.remove("complete");
        stepBadge.textContent = `Steg ${sIdx + 1} (${stepCorrect}/${stepInputs.length})`;
      }
    }
  });

  updateGuidedProgressBar();

  if (correctCount === inputs.length) {
    sfx.playWin();
    alert(`🎉 Perfekt! Alla ${correctCount} rader i alla ${dev.steps.length} steg är helt rätt för ${dev.name}!`);
  } else {
    sfx.playWrong();
    alert(`Du hade ${correctCount} av ${inputs.length} rätt på ${dev.name}. Felaktiga rader är rödmarkerade.`);
  }
}

function fillAllGuided() {
  sfx.playClick();
  const inputs = document.querySelectorAll(".guided-input");
  inputs.forEach(input => {
    input.value = input.getAttribute("data-target");
    checkSingleInput(input);
  });
  const dev = getCurrentDeviceModel();
  if (dev) {
    dev.steps.forEach((_, sIdx) => {
      const stepBadge = document.getElementById(`stepBadge_${sIdx}`);
      if (stepBadge) {
        stepBadge.classList.add("complete");
        stepBadge.textContent = `Steg ${sIdx + 1} ✓`;
      }
    });
  }
  updateGuidedProgressBar();
}

function validateUserConfiguration() {
  const userText = document.getElementById("configCodeEditor").value;
  const dev = getCurrentDeviceModel();
  if (!dev) return;

  const drawer = document.getElementById("validationDrawer");
  const detailsList = document.getElementById("validationDetailsList");
  const scoreBadge = document.getElementById("drawerScoreBadge");

  if (!drawer || !detailsList || !scoreBadge) return;
  drawer.style.display = "block";
  detailsList.innerHTML = "";

  // Normalize user lines
  const userLines = userText
    .split("\n")
    .map(l => l.replace(/^[a-zA-Z0-9_\-\.]+(\([^)]+\))?[#>$]\s*/i, "").trim())
    .filter(l => l && !l.startsWith("!") && !l.startsWith("%"));

  const expectedItems = dev.guidedItems || [];
  let matches = 0;

  expectedItems.forEach(item => {
    const target = item.target;
    const found = userLines.some(ul => isLooseCommandMatch(ul, target));

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

  const percentage = expectedItems.length > 0 ? Math.round((matches / expectedItems.length) * 100) : 0;
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
  if (!actual || !expected) return false;

  let act = actual.toLowerCase().replace(/^[a-z0-9_\-\.]+(\([^)]+\))?[#>$]\s*/i, "").replace(/\s+/g, " ").trim();
  let exp = expected.toLowerCase().replace(/^[a-z0-9_\-\.]+(\([^)]+\))?[#>$]\s*/i, "").replace(/\s+/g, " ").trim();

  if (act === exp) return true;

  const normalize = (cmd) => {
    return cmd
      .replace(/\bconf\s+t\b/g, "configure terminal")
      .replace(/\ben\b/g, "enable")
      .replace(/\bint\b/g, "interface")
      .replace(/\bfa\b/g, "fastethernet")
      .replace(/\bgi\b/g, "gigabitethernet")
      .replace(/\bpo\b/g, "port-channel")
      .replace(/\bsw\s+mo\s+acc\b/g, "switchport mode access")
      .replace(/\bsw\s+mo\s+tr\b/g, "switchport mode trunk")
      .replace(/\bsw\s+acc\s+vl(an)?\b/g, "switchport access vlan")
      .replace(/\bsw\s+tr\s+al\s+vl(an)?\b/g, "switchport trunk allowed vlan")
      .replace(/\bsw\s+tr\s+enc(ap)?\s+dot1q\b/g, "switchport trunk encapsulation dot1q")
      .replace(/\bno\s+sh(ut)?\b/g, "no shutdown")
      .replace(/\bsh(ut)?\b/g, "shutdown")
      .replace(/\bip\s+add?r?\b/g, "ip address")
      .replace(/\bip\s+def\b/g, "ip default-gateway")
      .replace(/\bcopy\s+run\s+star?t?\b/g, "copy running-config startup-config")
      .replace(/\bwr(ite)?(\s+mem(ory)?)?\b/g, "copy running-config startup-config")
      .replace(/\bspan(ning-tree)?\s+mode\s+rapid(-pvst)?\b/g, "spanning-tree mode rapid-pvst")
      .replace(/\bstandby\s+(\d+)\s+prio\b/g, "standby $1 priority")
      .replace(/\bstandby\s+(\d+)\s+pre\b/g, "standby $1 preempt")
      .replace(/\s+/g, " ")
      .trim();
  };

  return normalize(act) === normalize(exp);
}

function renderMiniTopology(labKey, devKey) {
  const isLabb6 = labKey === "labb6";
  const img = document.getElementById("topoImageDisplay");
  if (img) {
    img.src = isLabb6 ? "labb6_topologi.png" : "labb7_topologi.png";
    img.alt = isLabb6 ? "Labb 6 Topologi (Packet Tracer)" : "Labb 7 Topologi (Packet Tracer)";
  }

  const svg = document.getElementById("miniTopoSvg");
  if (!svg) return;

  const d = (devKey || "").toLowerCase();

  const getStyle = (name) => {
    const isActive = d === name.toLowerCase();
    return {
      fill: isActive ? "#ff2a5f" : "#14060c",
      stroke: isActive ? "#ffffff" : "#ff2a5f66",
      strokeWidth: isActive ? 3 : 1.5,
      textColor: isActive ? "#ffffff" : "#e0e0e0",
      glow: isActive ? 'filter="url(#glowFilter)"' : ""
    };
  };

  const ds1St = getStyle("ds1");
  const ds2St = getStyle("ds2");
  const s1St = getStyle("s1");
  const s2St = getStyle("s2");

  if (isLabb6) {
    const r3St = getStyle("r3");
    const r4St = getStyle("r4");

    svg.innerHTML = `
      <defs>
        <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <!-- Connections -->
      <line x1="170" y1="45" x2="370" y2="45" stroke="#ff2a5f55" stroke-width="2" stroke-dasharray="4,3"/>
      <line x1="170" y1="45" x2="170" y2="135" stroke="#00d2ff88" stroke-width="2"/>
      <line x1="370" y1="45" x2="370" y2="135" stroke="#00d2ff88" stroke-width="2"/>

      <!-- EtherChannel between DS1 & DS2 -->
      <line x1="170" y1="131" x2="370" y2="131" stroke="#ffaa00" stroke-width="2"/>
      <line x1="170" y1="139" x2="370" y2="139" stroke="#ffaa00" stroke-width="2"/>
      <rect x="245" y="125" width="50" height="20" rx="4" fill="#0d0408" stroke="#ffaa00" stroke-width="1"/>
      <text x="270" y="139" fill="#ffaa00" font-size="9" font-weight="bold" text-anchor="middle">Po1</text>

      <!-- Distribution to Access -->
      <line x1="170" y1="135" x2="170" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="170" y1="135" x2="370" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="370" y1="135" x2="170" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="370" y1="135" x2="370" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="170" y1="225" x2="370" y2="225" stroke="#445566" stroke-width="1.5" stroke-dasharray="3,3"/>

      <!-- R3 -->
      <circle cx="170" cy="45" r="22" fill="${r3St.fill}" stroke="${r3St.stroke}" stroke-width="${r3St.strokeWidth}" ${r3St.glow}/>
      <text x="170" y="49" fill="${r3St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">R3</text>
      <text x="170" y="20" fill="#a0aec0" font-size="9" text-anchor="middle">OSPF Area 0</text>

      <!-- R4 -->
      <circle cx="370" cy="45" r="22" fill="${r4St.fill}" stroke="${r4St.stroke}" stroke-width="${r4St.strokeWidth}" ${r4St.glow}/>
      <text x="370" y="49" fill="${r4St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">R4</text>
      <text x="370" y="20" fill="#a0aec0" font-size="9" text-anchor="middle">OSPF Area 0</text>

      <!-- DS1 -->
      <circle cx="170" cy="135" r="26" fill="${ds1St.fill}" stroke="${ds1St.stroke}" stroke-width="${ds1St.strokeWidth}" ${ds1St.glow}/>
      <text x="170" y="139" fill="${ds1St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">DS1</text>
      <text x="110" y="138" fill="#ff708f" font-size="9" text-anchor="middle">HSRP Active</text>

      <!-- DS2 -->
      <circle cx="370" cy="135" r="26" fill="${ds2St.fill}" stroke="${ds2St.stroke}" stroke-width="${ds2St.strokeWidth}" ${ds2St.glow}/>
      <text x="370" y="139" fill="${ds2St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">DS2</text>
      <text x="430" y="138" fill="#ffaa00" font-size="9" text-anchor="middle">HSRP Standby</text>

      <!-- S1 -->
      <rect x="140" y="213" width="60" height="26" rx="4" fill="${s1St.fill}" stroke="${s1St.stroke}" stroke-width="${s1St.strokeWidth}" ${s1St.glow}/>
      <text x="170" y="230" fill="${s1St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">S1</text>

      <!-- S2 -->
      <rect x="340" y="213" width="60" height="26" rx="4" fill="${s2St.fill}" stroke="${s2St.stroke}" stroke-width="${s2St.strokeWidth}" ${s2St.glow}/>
      <text x="370" y="230" fill="${s2St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">S2</text>
    `;
  } else {
    // Labb 7
    const r1St = getStyle("r1");
    const r2St = getStyle("r2");
    const r3St = getStyle("r3");

    svg.innerHTML = `
      <defs>
        <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Routers Redundant links -->
      <line x1="130" y1="45" x2="270" y2="45" stroke="#00d2ff88" stroke-width="2"/>
      <line x1="270" y1="45" x2="410" y2="45" stroke="#00d2ff88" stroke-width="2"/>
      <line x1="130" y1="45" x2="170" y2="135" stroke="#00d2ff88" stroke-width="2"/>
      <line x1="410" y1="45" x2="370" y2="135" stroke="#00d2ff88" stroke-width="2"/>

      <!-- EtherChannel between DS1 & DS2 -->
      <line x1="170" y1="131" x2="370" y2="131" stroke="#ffaa00" stroke-width="2"/>
      <line x1="170" y1="139" x2="370" y2="139" stroke="#ffaa00" stroke-width="2"/>
      <rect x="245" y="125" width="50" height="20" rx="4" fill="#0d0408" stroke="#ffaa00" stroke-width="1"/>
      <text x="270" y="139" fill="#ffaa00" font-size="9" font-weight="bold" text-anchor="middle">Po1</text>

      <!-- Distribution to Access -->
      <line x1="170" y1="135" x2="170" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="170" y1="135" x2="370" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="370" y1="135" x2="170" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="370" y1="135" x2="370" y2="225" stroke="#445566" stroke-width="1.5"/>
      <line x1="170" y1="225" x2="370" y2="225" stroke="#445566" stroke-width="1.5" stroke-dasharray="3,3"/>

      <!-- R1 -->
      <circle cx="130" cy="45" r="20" fill="${r1St.fill}" stroke="${r1St.stroke}" stroke-width="${r1St.strokeWidth}" ${r1St.glow}/>
      <text x="130" y="49" fill="${r1St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">R1</text>

      <!-- R3 (Hub/WAN) -->
      <circle cx="270" cy="45" r="20" fill="${r3St.fill}" stroke="${r3St.stroke}" stroke-width="${r3St.strokeWidth}" ${r3St.glow}/>
      <text x="270" y="49" fill="${r3St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">R3</text>

      <!-- R2 -->
      <circle cx="410" cy="45" r="20" fill="${r2St.fill}" stroke="${r2St.stroke}" stroke-width="${r2St.strokeWidth}" ${r2St.glow}/>
      <text x="410" y="49" fill="${r2St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">R2</text>

      <!-- DS1 -->
      <circle cx="170" cy="135" r="26" fill="${ds1St.fill}" stroke="${ds1St.stroke}" stroke-width="${ds1St.strokeWidth}" ${ds1St.glow}/>
      <text x="170" y="139" fill="${ds1St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">DS1</text>
      <text x="110" y="138" fill="#ff708f" font-size="9" text-anchor="middle">HSRP Active</text>

      <!-- DS2 -->
      <circle cx="370" cy="135" r="26" fill="${ds2St.fill}" stroke="${ds2St.stroke}" stroke-width="${ds2St.strokeWidth}" ${ds2St.glow}/>
      <text x="370" y="139" fill="${ds2St.textColor}" font-size="11" font-weight="bold" text-anchor="middle">DS2</text>
      <text x="430" y="138" fill="#ffaa00" font-size="9" text-anchor="middle">HSRP Standby</text>

      <!-- S1 -->
      <rect x="140" y="213" width="60" height="26" rx="4" fill="${s1St.fill}" stroke="${s1St.stroke}" stroke-width="${s1St.strokeWidth}" ${s1St.glow}/>
      <text x="170" y="230" fill="${s1St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">S1</text>

      <!-- S2 -->
      <rect x="340" y="213" width="60" height="26" rx="4" fill="${s2St.fill}" stroke="${s2St.stroke}" stroke-width="${s2St.strokeWidth}" ${s2St.glow}/>
      <text x="370" y="230" fill="${s2St.textColor}" font-size="10" font-weight="bold" text-anchor="middle">S2</text>
    `;
  }
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

// ==========================================
// 10. IPV4 SUBNETTING TRAINER MODULE
// ==========================================

function ipToInt(ip) {
  return ip.trim().split('.').reduce((acc, oct) => ((acc * 256) + parseInt(oct, 10)) >>> 0, 0) >>> 0;
}

function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

function isValidIpv4(ip) {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

function calcSubnet(ipStr, prefix) {
  const ipInt = ipToInt(ipStr);
  const maskInt = prefix === 0 ? 0 : ((0xFFFFFFFF << (32 - prefix)) >>> 0);
  const wildcardInt = (~maskInt) >>> 0;
  const netInt = (ipInt & maskInt) >>> 0;
  const bcastInt = (netInt | wildcardInt) >>> 0;

  const totalIps = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : totalIps - 2;

  const firstInt = prefix >= 31 ? netInt : (netInt + 1) >>> 0;
  const lastInt = prefix >= 31 ? bcastInt : (bcastInt - 1) >>> 0;

  const maskStr = intToIp(maskInt);
  const wildcardStr = intToIp(wildcardInt);
  const netStr = intToIp(netInt);
  const bcastStr = intToIp(bcastInt);
  const firstStr = intToIp(firstInt);
  const lastStr = intToIp(lastInt);

  // Active octet (1..4) where prefix ends
  const octetIndex = Math.min(3, Math.floor((prefix - 1) / 8));
  const maskOctets = maskStr.split('.').map(Number);
  const activeOctetMask = maskOctets[octetIndex];
  let magicNumber = 256 - activeOctetMask;
  if (prefix === 24) magicNumber = 256;

  const borrowedBits = prefix % 8 === 0 ? 8 : (prefix % 8);

  const firstOctet = parseInt(ipStr.split('.')[0], 10);
  let netClass = "Klass C";
  if (firstOctet < 128) netClass = "Klass A";
  else if (firstOctet < 192) netClass = "Klass B";

  return {
    ip: ipStr,
    prefix,
    mask: maskStr,
    wildcard: wildcardStr,
    netId: netStr,
    firstHost: firstStr,
    lastHost: lastStr,
    bcast: bcastStr,
    usableHosts,
    magicNumber,
    borrowedBits,
    activeOctet: octetIndex + 1,
    activeOctetMask,
    netClass
  };
}

function generateRandomSubnetTask(diff = "classC") {
  let targetDiff = diff;
  if (targetDiff === "mixed" || targetDiff === "random") {
    const pool = ["classC", "classC", "classC", "classB", "classB", "classA"];
    targetDiff = pool[Math.floor(Math.random() * pool.length)];
  }

  let ip = "";
  let prefix = 24;

  if (targetDiff === "classC") {
    // /24 - /30
    const prefixes = [24, 25, 26, 26, 27, 27, 28, 28, 29, 30];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const o3 = Math.floor(Math.random() * 50) + 1;
    const o4 = Math.floor(Math.random() * 254) + 1;
    ip = `192.168.${o3}.${o4}`;
  } else if (targetDiff === "classB") {
    // /17 - /23
    const prefixes = [17, 18, 19, 20, 21, 22, 23];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const o2 = 16 + Math.floor(Math.random() * 16);
    const o3 = Math.floor(Math.random() * 250) + 1;
    const o4 = Math.floor(Math.random() * 254) + 1;
    ip = `172.${o2}.${o3}.${o4}`;
  } else {
    // classA: /9 - /15
    const prefixes = [9, 10, 11, 12, 13, 14, 15];
    prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const o2 = Math.floor(Math.random() * 250) + 1;
    const o3 = Math.floor(Math.random() * 250) + 1;
    const o4 = Math.floor(Math.random() * 254) + 1;
    ip = `10.${o2}.${o3}.${o4}`;
  }

  return calcSubnet(ip, prefix);
}

function initSubnetTrainer() {
  const container = document.getElementById("tab-subnetting");
  if (!container) return;

  // Initialize first task
  state.subnet.difficulty = "classC";
  state.subnet.solvedCount = 0;
  state.subnet.streak = 0;
  state.subnet.currentTask = generateRandomSubnetTask("classC");
  renderSubnetTask();

  // Difficulty Pill Selectors
  const diffPills = container.querySelectorAll("#subnetDiffSelector .pill-btn, .diff-pill");
  diffPills.forEach(pill => {
    pill.addEventListener("click", () => {
      sfx.playClick();
      diffPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.subnet.difficulty = pill.getAttribute("data-diff") || "classC";
      state.subnet.currentTask = generateRandomSubnetTask(state.subnet.difficulty);
      renderSubnetTask();
    });
  });

  // Action Buttons
  const newBtn = document.getElementById("subnetNewTaskBtn");
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      sfx.playClick();
      state.subnet.currentTask = generateRandomSubnetTask(state.subnet.difficulty);
      renderSubnetTask();
    });
  }

  const nextBtn = document.getElementById("subnetNextBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      sfx.playClick();
      state.subnet.currentTask = generateRandomSubnetTask(state.subnet.difficulty);
      renderSubnetTask();
    });
  }

  const checkBtn = document.getElementById("subnetCheckBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      checkSubnetTask();
    });
  }

  const hintBtn = document.getElementById("subnetHintBtn");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      showSubnetHint();
    });
  }

  const solveBtn = document.getElementById("subnetSolveBtn");
  if (solveBtn) {
    solveBtn.addEventListener("click", () => {
      showSubnetSolution();
    });
  }

  // Custom IP Drawer Toggle
  const customToggleBtn = document.getElementById("subnetCustomToggleBtn");
  const customDrawer = document.getElementById("subnetCustomDrawer");
  if (customToggleBtn && customDrawer) {
    customToggleBtn.addEventListener("click", () => {
      sfx.playClick();
      const isHidden = customDrawer.style.display === "none";
      customDrawer.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        document.getElementById("customIpInput")?.focus();
      }
    });
  }

  // Set Custom IP
  const setCustomBtn = document.getElementById("subnetSetCustomBtn");
  const customInput = document.getElementById("customIpInput");
  if (setCustomBtn && customInput) {
    const handleCustomSubmit = () => {
      const val = customInput.value.trim();
      if (!val) return;
      const parsed = parseCustomIp(val);
      if (parsed) {
        sfx.playCorrect();
        state.subnet.currentTask = calcSubnet(parsed.ip, parsed.prefix);
        if (customDrawer) customDrawer.style.display = "none";
        renderSubnetTask();
        const fb = document.getElementById("subnetFeedbackBox");
        if (fb) {
          fb.style.display = "block";
          fb.className = "subnet-feedback-box feedback-info";
          fb.innerHTML = `✅ Laddade uppgift med din egen IP: <strong>${parsed.ip}/${parsed.prefix}</strong>. Beräkna nätverksdatan!`;
        }
      } else {
        sfx.playWrong();
        alert("Ogiltig IP eller prefix! Format: t.ex. 192.168.1.100/26 eller 10.0.5.20/22 (prefix mellan /8 och /30).");
      }
    };

    setCustomBtn.addEventListener("click", handleCustomSubmit);
    customInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCustomSubmit();
      }
    });
  }

  // Cheat Sheet Section Toggle
  const cheatToggleNavBtn = document.getElementById("subnetCheatToggleBtn");
  const cheatSection = document.getElementById("subnetCheatSection");
  if (cheatToggleNavBtn && cheatSection) {
    cheatToggleNavBtn.addEventListener("click", () => {
      sfx.playClick();
      cheatSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const cheatToggleTableBtn = document.getElementById("cheatToggleTableBtn");
  const cheatTableWrap = document.getElementById("cheatTableWrap");
  if (cheatToggleTableBtn && cheatTableWrap) {
    cheatToggleTableBtn.addEventListener("click", () => {
      sfx.playClick();
      const isHidden = cheatTableWrap.style.display === "none";
      cheatTableWrap.style.display = isHidden ? "block" : "none";
      cheatToggleTableBtn.textContent = isHidden ? "Minimera" : "Visa Lathund";
    });
  }

  // Keyboard navigation through input fields: Enter moves to next or checks
  const inputOrder = ["subNetId", "subFirstHost", "subLastHost", "subBcast", "subMask", "subHosts"];
  inputOrder.forEach((id, idx) => {
    const inputEl = document.getElementById(id);
    if (!inputEl) return;
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (idx < inputOrder.length - 1) {
          const nextEl = document.getElementById(inputOrder[idx + 1]);
          if (nextEl) nextEl.focus();
        } else {
          checkSubnetTask();
        }
      }
    });
  });
}

function parseCustomIp(str) {
  const raw = str.trim();
  let ip = "";
  let prefix = 24;

  if (raw.includes("/")) {
    const parts = raw.split("/");
    ip = parts[0].trim();
    prefix = parseInt(parts[1].trim(), 10);
  } else if (raw.includes(" ")) {
    const parts = raw.split(/\s+/);
    ip = parts[0].trim();
    // could be mask dotted decimal
    const maskPart = parts[1].trim();
    if (maskPart.includes(".")) {
      prefix = maskToPrefix(maskPart);
    } else {
      prefix = parseInt(maskPart, 10);
    }
  } else {
    ip = raw;
    prefix = 24;
  }

  if (!isValidIpv4(ip)) return null;
  if (isNaN(prefix) || prefix < 8 || prefix > 30) return null;

  return { ip, prefix };
}

function maskToPrefix(maskStr) {
  if (!isValidIpv4(maskStr)) return 24;
  const int = ipToInt(maskStr);
  let p = 0;
  for (let i = 31; i >= 0; i--) {
    if ((int >>> i) & 1) p++;
    else break;
  }
  return p;
}

function renderSubnetTask() {
  const task = state.subnet.currentTask;
  if (!task) return;

  const ipEl = document.getElementById("subnetTargetIp");
  const prefixEl = document.getElementById("subnetTargetPrefix");
  const classBadge = document.getElementById("subnetClassBadge");
  const prefixBadge = document.getElementById("subnetPrefixBadge");

  if (ipEl) ipEl.textContent = task.ip;
  if (prefixEl) prefixEl.textContent = task.prefix;
  if (classBadge) classBadge.textContent = task.netClass;
  if (prefixBadge) prefixBadge.textContent = `Prefix: /${task.prefix}`;

  // Clear inputs and status indicators
  const fieldIds = ["subNetId", "subFirstHost", "subLastHost", "subBcast", "subMask", "subHosts"];
  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.value = "";
      input.classList.remove("field-correct", "field-wrong");
    }
  });

  const statusMap = {
    subNetId: "status-netId",
    subFirstHost: "status-firstHost",
    subLastHost: "status-lastHost",
    subBcast: "status-bcast",
    subMask: "status-mask",
    subHosts: "status-hosts"
  };
  Object.values(statusMap).forEach(sId => {
    const sEl = document.getElementById(sId);
    if (sEl) {
      sEl.textContent = "";
      sEl.className = "field-status";
    }
  });

  // Hide feedback and solution boxes
  const fb = document.getElementById("subnetFeedbackBox");
  if (fb) {
    fb.style.display = "none";
    fb.innerHTML = "";
  }

  const sol = document.getElementById("subnetSolutionBox");
  if (sol) {
    sol.style.display = "none";
    sol.innerHTML = "";
  }

  // Update stats counters
  const solvedEl = document.getElementById("subnetSolvedCount");
  if (solvedEl) solvedEl.textContent = state.subnet.solvedCount;

  const streakEl = document.getElementById("subnetStreakCount");
  if (streakEl) streakEl.textContent = `🔥 ${state.subnet.streak}`;

  // Focus the first input field
  const firstInput = document.getElementById("subNetId");
  if (firstInput) firstInput.focus();
}

function checkSubnetTask() {
  const task = state.subnet.currentTask;
  if (!task) return;

  const fields = [
    { id: "subNetId", sId: "status-netId", expected: task.netId, label: "Nätverksadress" },
    { id: "subFirstHost", sId: "status-firstHost", expected: task.firstHost, label: "Första värd" },
    { id: "subLastHost", sId: "status-lastHost", expected: task.lastHost, label: "Sista värd" },
    { id: "subBcast", sId: "status-bcast", expected: task.bcast, label: "Broadcast" },
    { id: "subMask", sId: "status-mask", expected: task.mask, label: "Nätmask" },
    { id: "subHosts", sId: "status-hosts", expected: String(task.usableHosts), label: "Antal värdar" }
  ];

  let correctCount = 0;

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const status = document.getElementById(f.sId);
    if (!input || !status) return;

    const val = input.value.trim();
    input.classList.remove("field-correct", "field-wrong");

    if (!val) {
      input.classList.add("field-wrong");
      status.className = "field-status status-wrong";
      status.innerHTML = `⚠️ Ej ifylld (Rätt: <code>${f.expected}</code>)`;
    } else if (val.toLowerCase() === f.expected.toLowerCase()) {
      correctCount++;
      input.classList.add("field-correct");
      status.className = "field-status status-correct";
      status.innerHTML = `✓ Rätt!`;
    } else {
      input.classList.add("field-wrong");
      status.className = "field-status status-wrong";
      status.innerHTML = `✗ Fel (Rätt svar: <code>${f.expected}</code>)`;
    }
  });

  const fb = document.getElementById("subnetFeedbackBox");

  if (correctCount === fields.length) {
    state.subnet.solvedCount++;
    state.subnet.streak++;
    sfx.playWin();

    if (fb) {
      fb.style.display = "block";
      fb.className = "subnet-feedback-box feedback-success";
      fb.innerHTML = `
        <div class="fb-header">
          <span class="fb-icon">🎉</span>
          <strong>Fantastiskt! Alla 6 parametrarna är 100% korrekta!</strong>
        </div>
        <p>Du har bemästrat <strong>${task.ip}/${task.prefix}</strong>. Din streak är nu <strong>🔥 ${state.subnet.streak} i rad!</strong></p>
      `;
    }

    // Auto-reveal step-by-step math explanation
    showSubnetSolution(false);
  } else {
    state.subnet.streak = 0;
    sfx.playWrong();

    if (fb) {
      fb.style.display = "block";
      fb.className = "subnet-feedback-box feedback-error";
      fb.innerHTML = `
        <div class="fb-header">
          <span class="fb-icon">⚠️</span>
          <strong>${correctCount} av ${fields.length} rätt.</strong>
        </div>
        <p>Kontrollera de rödmarkerade fälten ovan. Klicka på <strong>💡 Visa Ledtråd</strong> för att se Magic Number och steglängd!</p>
      `;
    }
  }

  // Update counters
  const solvedEl = document.getElementById("subnetSolvedCount");
  if (solvedEl) solvedEl.textContent = state.subnet.solvedCount;

  const streakEl = document.getElementById("subnetStreakCount");
  if (streakEl) streakEl.textContent = `🔥 ${state.subnet.streak}`;
}

function showSubnetHint() {
  const task = state.subnet.currentTask;
  if (!task) return;

  sfx.playTone(440, "triangle", 0.15);

  const fb = document.getElementById("subnetFeedbackBox");
  if (!fb) return;

  const ipOctets = task.ip.split('.');
  const relevantOctetVal = ipOctets[task.activeOctet - 1];

  let stepMsg = "";
  if (task.prefix >= 24) {
    stepMsg = `Ändringen sker i <strong>4:e oktetten</strong> (sista siffran: <code>${relevantOctetVal}</code>).`;
  } else if (task.prefix >= 16) {
    stepMsg = `Ändringen sker i <strong>3:e oktetten</strong> (siffran: <code>${relevantOctetVal}</code>). 4:e oktetten blir 0 för nätverk och 255 för broadcast.`;
  } else {
    stepMsg = `Ändringen sker i <strong>2:a oktetten</strong> (siffran: <code>${relevantOctetVal}</code>).`;
  }

  fb.style.display = "block";
  fb.className = "subnet-feedback-box feedback-hint";
  fb.innerHTML = `
    <div class="fb-header">
      <span class="fb-icon">💡</span>
      <strong>Pedagogisk Ledtråd för ${task.ip}/${task.prefix}:</strong>
    </div>
    <ul class="hint-list">
      <li><strong>Aktiv oktett:</strong> ${stepMsg}</li>
      <li><strong>Nätmask i aktiv oktett:</strong> <code>${task.activeOctetMask}</code></li>
      <li><strong>Magic Number (Steglängd):</strong> <code>256 - ${task.activeOctetMask} = ${task.magicNumber}</code>.</li>
      <li><strong>Subnätsgränser:</strong> Subnäten i oktett ${task.activeOctet} börjar på multiplar av ${task.magicNumber}: 
        <code>0, ${task.magicNumber}, ${task.magicNumber * 2}, ${task.magicNumber * 3}...</code>. 
        Vilket block hamnar <code>${relevantOctetVal}</code> i?
      </li>
      <li><strong>Antal värdar:</strong> Formel <code>2^(32 - ${task.prefix}) - 2 = 2^${32 - task.prefix} - 2 = ${task.usableHosts}</code></li>
    </ul>
  `;
}

function showSubnetSolution(fillInputs = true) {
  const task = state.subnet.currentTask;
  if (!task) return;

  if (fillInputs) {
    sfx.playTone(550, "sine", 0.15);
    // Fill all inputs with correct values
    const map = {
      subNetId: task.netId,
      subFirstHost: task.firstHost,
      subLastHost: task.lastHost,
      subBcast: task.bcast,
      subMask: task.mask,
      subHosts: task.usableHosts
    };
    Object.entries(map).forEach(([id, val]) => {
      const input = document.getElementById(id);
      if (input) {
        input.value = val;
        input.classList.remove("field-wrong");
        input.classList.add("field-correct");
      }
    });

    const statusMap = {
      subNetId: "status-netId",
      subFirstHost: "status-firstHost",
      subLastHost: "status-lastHost",
      subBcast: "status-bcast",
      subMask: "status-mask",
      subHosts: "status-hosts"
    };
    Object.values(statusMap).forEach(sId => {
      const sEl = document.getElementById(sId);
      if (sEl) {
        sEl.textContent = "✓ Facit ifyllt";
        sEl.className = "field-status status-correct";
      }
    });
  }

  const sol = document.getElementById("subnetSolutionBox");
  if (!sol) return;

  const octets = task.ip.split('.');
  const activeOctVal = parseInt(octets[task.activeOctet - 1], 10);
  const netOctVal = parseInt(task.netId.split('.')[task.activeOctet - 1], 10);
  const bcastOctVal = parseInt(task.bcast.split('.')[task.activeOctet - 1], 10);

  sol.style.display = "block";
  sol.innerHTML = `
    <div class="solution-header">
      <span class="solution-icon">🎓</span>
      <h3>Steg-för-steg Lösning & Facit för ${task.ip}/${task.prefix}</h3>
    </div>
    
    <div class="solution-steps-grid">
      <div class="sol-step card">
        <div class="sol-step-title">Steg 1: Nätmask & Bitar</div>
        <p>Prefixet <code>/${task.prefix}</code> innebär att de första <strong>${task.prefix} bitarna är 1:or</strong> och resten (${32 - task.prefix} st) är 0:or.</p>
        <div class="sol-code-box">
          Nätmask (decimal): <strong>${task.mask}</strong><br>
          Wildcard mask: <strong>${task.wildcard}</strong>
        </div>
      </div>

      <div class="sol-step card">
        <div class="sol-step-title">Steg 2: Magic Number (Steglängd)</div>
        <p>Ändringen sker i oktett <strong>${task.activeOctet}</strong> där masken är <code>${task.activeOctetMask}</code>.</p>
        <div class="sol-code-box">
          Magic Number = 256 - ${task.activeOctetMask} = <strong>${task.magicNumber}</strong>
        </div>
        <p class="sol-subtext">Subnäten börjar på multiplar av ${task.magicNumber}: 0, ${task.magicNumber}, ${task.magicNumber * 2}, ${task.magicNumber * 3}...</p>
      </div>

      <div class="sol-step card">
        <div class="sol-step-title">Steg 3: Hitta Nätverksadress & Broadcast</div>
        <p>Oktett ${task.activeOctet} har värdet <code>${activeOctVal}</code>. Det ligger i blocket mellan <strong>${netOctVal}</strong> och <strong>${bcastOctVal}</strong>:</p>
        <div class="sol-code-box">
          Nätverksadress: <strong>${task.netId}</strong><br>
          Broadcast-adress: <strong>${task.bcast}</strong>
        </div>
      </div>

      <div class="sol-step card">
        <div class="sol-step-title">Steg 4: Värdintervall & Antal Värdar</div>
        <p>Första giltiga IP är nätverk + 1, och sista giltiga IP är broadcast - 1:</p>
        <div class="sol-code-box">
          Första värd: <strong>${task.firstHost}</strong><br>
          Sista värd: <strong>${task.lastHost}</strong><br>
          Antal värdar: 2^${32 - task.prefix} - 2 = <strong>${task.usableHosts} st</strong>
        </div>
      </div>
    </div>
  `;
}

