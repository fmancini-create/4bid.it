export type ProblemSeoContent = {
  intro: string
  impact: string
  checks: [string, string, string]
  approach: [string, string, string]
}

/**
 * Contenuto editoriale specifico per ogni pagina del cluster /problemi-hotel/*.
 * Non usare testi generici per categoria: l'obiettivo e' che ogni URL risponda
 * a un problema e a un intento di ricerca realmente distinti.
 */
export const PROBLEM_SEO_CONTENT: Record<string, ProblemSeoContent> = {
  prezzi: {
    intro: "Se il prezzo cambia soprattutto in base alla sensazione del momento, e' difficile capire dopo se una tariffa ha funzionato per merito della domanda o per caso. La diagnosi parte dal confronto tra domanda attesa, prenotazioni gia' acquisite e risultato economico della data.",
    impact: "Una tariffa troppo bassa nei giorni forti brucia margine che non si recupera; una tariffa troppo alta nei giorni deboli rallenta il pickup. Il costo vero dell'intuito e' non sapere quale decisione replicare la volta successiva.",
    checks: [
      "Confronta ADR, occupazione e RevPAR della data con storico, budget e stesso giorno della settimana.",
      "Guarda il pickup per data di soggiorno e non soltanto l'occupazione finale gia' raggiunta.",
      "Verifica se esistono limiti minimi e massimi di prezzo coerenti con camera, stagione e domanda.",
    ],
    approach: [
      "Definisci una tariffa di riferimento e bande di variazione per stagione e tipologia di camera.",
      "Associa ogni variazione a segnali osservabili: pickup, lead time, eventi, disponibilita' e andamento competitivo.",
      "Rivedi a posteriori le decisioni per capire quali regole hanno prodotto ricavo incrementale e quali no.",
    ],
  },
  kpi: {
    intro: "RevPAR, ADR e occupazione sono utili solo se calcolati sulla stessa base e letti insieme. Valori corretti ma provenienti da periodi, camere o fonti diverse possono portare a conclusioni sbagliate quanto un dato errato.",
    impact: "Quando i KPI non sono condivisi dal team, ogni reparto finisce per raccontare una versione diversa della performance. Questo rallenta le decisioni e rende difficile distinguere un problema di prezzo da uno di domanda o di mix.",
    checks: [
      "Verifica che ADR, occupazione e RevPAR usino lo stesso perimetro di camere e lo stesso intervallo temporale.",
      "Controlla se cancellazioni, no-show, camere fuori servizio e ricavi accessori sono trattati sempre nello stesso modo.",
      "Confronta il dato attuale con budget, anno precedente e pickup, evitando di giudicare un KPI isolato.",
    ],
    approach: [
      "Fissa una definizione unica per ogni KPI e documenta la fonte ufficiale del dato.",
      "Costruisci una dashboard con pochi indicatori collegati tra loro invece di moltiplicare grafici e metriche.",
      "Associa soglie e azioni ai KPI: un numero deve far scattare una verifica o una decisione concreta.",
    ],
  },
  pickup: {
    intro: "Il pickup dice quanto inventario si aggiunge o si perde nel tempo per una determinata data di soggiorno. Guardarlo senza confrontare lo stesso lead time o senza sottrarre le cancellazioni puo' dare una sensazione di accelerazione che non esiste.",
    impact: "Accorgersi tardi che il ritmo di prenotazione e' cambiato significa reagire quando gran parte della finestra commerciale e' gia' passata. Il danno puo' essere sia un prezzo troppo basso sia camere rimaste invendute.",
    checks: [
      "Confronta il pickup netto a 7, 14, 30 e 60 giorni con le stesse finestre dell'anno o periodo comparabile.",
      "Separa nuove prenotazioni, cancellazioni e modifiche per non confondere crescita lorda e crescita reale.",
      "Leggi il pickup per segmento e canale: corporate, leisure, OTA e diretto possono muoversi in direzioni opposte.",
    ],
    approach: [
      "Salva snapshot regolari dell'on-the-books per poter confrontare davvero il ritmo nel tempo.",
      "Definisci scostamenti rilevanti rispetto al riferimento e collega a ciascuno una verifica tariffaria.",
      "Usa il pickup insieme a disponibilita', lead time ed eventi prima di modificare prezzo o restrizioni.",
    ],
  },
  "forecast-domanda": {
    intro: "Prevedere la domanda non significa indovinare l'occupazione finale: significa aggiornare una stima man mano che arrivano prenotazioni, cancellazioni, eventi e segnali di mercato. Un forecast utile deve quindi essere vivo e verificabile.",
    impact: "Un forecast debole influenza prezzi, personale, acquisti e cassa. Se la previsione viene aggiornata soltanto a fine mese, non e' piu' uno strumento decisionale ma una fotografia tardiva.",
    checks: [
      "Confronta curva on-the-books e pickup con periodi realmente comparabili per stagione e giorno della settimana.",
      "Inserisci nel forecast cancellazioni attese, gruppi, eventi e variazioni di capacita' invece di usare solo lo storico.",
      "Misura l'errore tra forecast precedente e consuntivo per capire dove il modello sbaglia sistematicamente.",
    ],
    approach: [
      "Crea un forecast rolling per data di soggiorno con aggiornamenti frequenti nelle finestre piu' vicine.",
      "Mantieni almeno uno scenario base e uno scenario di rischio quando la domanda e' incerta.",
      "Collega lo scostamento dal forecast a decisioni su pricing, restrizioni, marketing e organizzazione operativa.",
    ],
  },
  "competitor-rate": {
    intro: "Il prezzo del competitor e' un segnale, non il prezzo giusto per il tuo hotel. Confrontare tariffe non omogenee per camera, condizioni o disponibilita' porta facilmente a inseguire il mercato invece di leggerlo.",
    impact: "Copiare la concorrenza puo' comprimere il prezzo nei giorni in cui hai piu' domanda o spingerti troppo in alto quando il tuo prodotto non e' comparabile. Il rischio e' perdere sia margine sia conversione.",
    checks: [
      "Verifica che il comp set sia davvero comparabile per posizione, categoria, servizi, reputazione e clientela.",
      "Confronta la stessa occupazione, politica di cancellazione, trattamento e tipologia di camera quando possibile.",
      "Distingui un aumento reale di prezzo da una tariffa rimasta visibile perche' le camere piu' economiche sono esaurite.",
    ],
    approach: [
      "Riduci il comp set a pochi concorrenti realmente significativi e rivedilo periodicamente.",
      "Registra trend e variazioni invece di reagire a una singola rilevazione.",
      "Usa la concorrenza come conferma o allarme insieme ai tuoi pickup, disponibilita' e obiettivi di prezzo.",
    ],
  },
  "regole-vendita": {
    intro: "MinLOS, stop sale, CTA e CTD possono proteggere inventario prezioso, ma una restrizione applicata senza misurare la domanda rifiutata puo' creare buchi difficili da riempire. La regola deve avere un motivo economico preciso.",
    impact: "Una restrizione troppo aggressiva non si vede soltanto nelle prenotazioni perse: puo' peggiorare il pattern di soggiorno e lasciare notti isolate. Una regola troppo debole, invece, puo' consumare inventario che vale di piu' su soggiorni piu' lunghi.",
    checks: [
      "Analizza pattern di arrivo, partenza e durata soggiorno sulle date ad alta compressione.",
      "Controlla quante richieste non trovano disponibilita' a causa della restrizione e non per esaurimento reale.",
      "Verifica i buchi di una notte e l'effetto delle regole sulle date prima e dopo l'evento o il picco.",
    ],
    approach: [
      "Definisci quale inventario vuoi proteggere e quale comportamento di prenotazione vuoi favorire.",
      "Applica la restrizione solo alle date e ai canali dove il beneficio atteso supera il rischio di domanda rifiutata.",
      "Rimuovi o allenta la regola se pickup e forecast non confermano la domanda prevista.",
    ],
  },
  "eventi-domanda": {
    intro: "Fiere, concerti, matrimoni, ponti e appuntamenti locali possono modificare il lead time e la disponibilita' prima che l'effetto sia evidente nel PMS. La sfida e' intercettare il segnale quando c'e' ancora inventario da valorizzare.",
    impact: "Scoprire un evento dopo che le camere sono gia' state vendute a tariffa ordinaria significa perdere un'opportunita' non recuperabile. L'errore opposto e' alzare i prezzi per un evento che non genera domanda sulla tua zona o sul tuo segmento.",
    checks: [
      "Mantieni un calendario di eventi con distanza, capienza, durata e storico dell'impatto sulla struttura.",
      "Confronta pickup, ricerche e prezzi competitor nelle settimane che precedono l'evento.",
      "Verifica se l'evento cambia anche durata soggiorno, giorno di arrivo e segmento, non solo il volume.",
    ],
    approach: [
      "Classifica gli eventi per impatto osservato e non soltanto per notorieta'.",
      "Crea alert anticipati coerenti con il lead time tipico del tuo mercato.",
      "Aggiorna pricing e restrizioni in modo progressivo, confermando l'effetto con il pickup reale.",
    ],
  },
  "autopilot-prezzi": {
    intro: "Automatizzare il pricing ha senso quando il sistema sa quali limiti non deve superare e quando un operatore puo' capire perche' una modifica e' stata proposta. Un autopilot senza guardrail trasforma un errore di regola in molte decisioni sbagliate.",
    impact: "L'automazione riduce il lavoro ripetitivo, ma amplifica rapidamente dati errati, mapping incompleti o anomalie di domanda. Il controllo deve quindi concentrarsi sulle eccezioni e non sul clic quotidiano per cambiare tariffa.",
    checks: [
      "Verifica minimi, massimi, arrotondamenti e differenze tra tipologie prima di consentire scritture automatiche.",
      "Controlla qualita' e freschezza dei dati PMS, pickup, eventi e competitor usati dal motore.",
      "Assicurati che ogni variazione abbia log, motivazione e possibilita' di override o rollback.",
    ],
    approach: [
      "Parti in modalita' raccomandazione e misura quante proposte accetteresti davvero.",
      "Attiva l'automazione solo su date e regole con guardrail chiari, mantenendo alert sulle eccezioni.",
      "Rivedi periodicamente risultati e override per migliorare le regole invece di disattivare il controllo umano.",
    ],
  },

  ota: {
    intro: "Il problema non e' essere presenti su Booking o Expedia, ma non sapere quanto margine netto dipende da quei canali e quanta domanda sarebbe arrivata comunque in diretto. La diagnosi deve partire dal costo effettivo di distribuzione.",
    impact: "Una quota OTA elevata puo' essere sostenibile in alcuni periodi e molto costosa in altri. Senza distinguere domanda incrementale, commissioni, cancellazioni e costi del canale diretto, si rischia di ridurre OTA nel momento sbagliato o di dipenderne senza accorgersene.",
    checks: [
      "Calcola commissione effettiva, promozioni, sconti e costi accessori per ogni OTA.",
      "Confronta cancellazioni, ADR netto e lead time dei portali con il canale diretto.",
      "Verifica rate parity, vantaggi diretti e quota di clienti che tornano ancora tramite intermediario.",
    ],
    approach: [
      "Costruisci un conto economico per canale basato sul ricavo netto e non sul fatturato lordo.",
      "Rafforza il diretto con valore, CRM e follow-up prima di tagliare visibilita' alle OTA.",
      "Ribilancia inventario e promozioni per stagione, misurando se la domanda spostata resta davvero acquisita.",
    ],
  },
  dirette: {
    intro: "Se il sito riceve visite ma poche prenotazioni, il problema puo' nascere prima del booking engine, dentro il motore o nel follow-up delle richieste. Serve leggere il funnel dall'ingresso fino alla conferma, non limitarsi al totale delle vendite dirette.",
    impact: "Ogni passaggio inutile tra sito, disponibilita', preventivo e pagamento aumenta l'abbandono. Inoltre una proposta diretta poco chiara costringe l'ospite a tornare sulle OTA anche quando aveva gia' scelto la struttura.",
    checks: [
      "Misura quante sessioni arrivano a verificare disponibilita' e quante completano la prenotazione, soprattutto da mobile.",
      "Confronta prezzo, condizioni, vantaggi e disponibilita' del sito con cio' che l'utente vede sulle OTA nello stesso momento.",
      "Controlla tempi di risposta, preventivi abbandonati ed eventuali errori o frizioni nel booking engine.",
    ],
    approach: [
      "Individua il punto del funnel con la perdita maggiore prima di aumentare traffico pubblicitario.",
      "Rendi evidente il vantaggio del diretto e riduci campi, passaggi e dubbi nella fase di conferma.",
      "Recupera richieste e preventivi non chiusi con follow-up tracciati e coerenti con il consenso del cliente.",
    ],
  },
  "conversione-preventivi": {
    intro: "Un preventivo non e' soltanto un prezzo: e' una fase della trattativa con tempi, obiezioni e prossima azione. Se dopo l'invio non esiste un follow-up misurabile, molte opportunita' diventano silenziosamente perse.",
    impact: "Una bassa conversione dei preventivi spreca domanda gia' acquisita e rende piu' costoso ogni investimento marketing. Senza distinguere mancata risposta, prezzo, disponibilita' e tempi di contatto, e' difficile capire cosa correggere.",
    checks: [
      "Misura conversione per origine della richiesta, operatore, tipologia di soggiorno e tempo di risposta.",
      "Controlla quanti preventivi scadono senza almeno un follow-up e dopo quante ore o giorni.",
      "Raccogli il motivo di perdita quando e' noto: prezzo, condizioni, camera, destinazione o mancata risposta.",
    ],
    approach: [
      "Assegna a ogni preventivo uno stato, un responsabile e una prossima azione con scadenza.",
      "Standardizza le informazioni essenziali lasciando spazio a una proposta personalizzata per il caso.",
      "Analizza mensilmente i motivi di perdita e modifica template, tempi o politica commerciale sulla base dei dati.",
    ],
  },
  "lead-followup": {
    intro: "Quando i lead vivono tra inbox, agenda e memoria degli operatori, il problema emerge solo quando qualcuno chiede perche' non e' stato richiamato. Un follow-up efficace deve rendere visibile la prossima azione prima che scada.",
    impact: "Il costo e' doppio: opportunita' perse e tempo speso a ricostruire cosa e' gia' successo. Inoltre diventa impossibile capire se la pipeline e' ferma per mancanza di domanda o per mancanza di esecuzione.",
    checks: [
      "Conta lead senza responsabile, senza stato o senza prossima azione pianificata.",
      "Misura il tempo tra richiesta, prima risposta, preventivo e successivo contatto.",
      "Verifica quanti lead restano aperti oltre la finestra in cui il soggiorno o l'opportunita' e' ancora acquistabile.",
    ],
    approach: [
      "Definisci pochi stadi di pipeline con criteri chiari di entrata e uscita.",
      "Rendi obbligatoria una prossima azione per ogni opportunita' non chiusa.",
      "Usa priorita' e automazioni per ricordare, non per sostituire, il contatto commerciale ad alto valore.",
    ],
  },
  "crm-contatti": {
    intro: "Un CRM serve prima di tutto a sapere chi e' il contatto, con quale azienda o soggiorno e' collegato e cosa e' gia' successo. Se la stessa persona esiste in tre rubriche, ogni comunicazione parte con un'informazione incompleta.",
    impact: "Duplicati e anagrafiche scollegate peggiorano segmentazione, follow-up e reporting. Possono anche aumentare il rischio di contattare la stessa persona piu' volte o usare dati non aggiornati.",
    checks: [
      "Cerca duplicati per email, telefono, azienda e dominio e verifica quale sistema contiene il dato piu' affidabile.",
      "Distingui ospiti, aziende, agenzie e referenti senza perdere le relazioni tra le anagrafiche.",
      "Controlla provenienza, consensi e ultimo contatto prima di migrare liste in un unico CRM.",
    ],
    approach: [
      "Scegli una fonte anagrafica primaria e regole esplicite di deduplicazione.",
      "Migra prima i campi realmente usati dal processo commerciale, evitando archivi pieni ma inutilizzabili.",
      "Collega conversazioni, opportunita' e attivita' alla stessa scheda per costruire uno storico operativo.",
    ],
  },
  "b2b-prospecting": {
    intro: "Cercare aziende e agenzie senza un profilo target produce liste lunghe e poco utilizzabili. Il prospecting B2B funziona quando settore, ruolo, area geografica e motivo del contatto sono definiti prima della ricerca.",
    impact: "Dati generici o ruoli sbagliati aumentano rimbalzi, tempo perso e contatti irrilevanti. Una lista piu' piccola ma coerente con l'offerta vale piu' di migliaia di nominativi non qualificati.",
    checks: [
      "Definisci il profilo azienda ideale con settore, dimensione, territorio e potenziale bisogno di soggiorni.",
      "Mappa piu' titoli e sinonimi per lo stesso ruolo decisionale invece di affidarti a una sola etichetta.",
      "Verifica email, telefono, fonte e data di aggiornamento prima di inserire il prospect in una sequenza.",
    ],
    approach: [
      "Costruisci segmenti piccoli e omogenei con una proposta pertinente al loro caso d'uso.",
      "Importa i prospect nel CRM con origine, criteri di ricerca e responsabile commerciale.",
      "Misura risposte e opportunita' per segmento per affinare il targeting, non soltanto il volume di contatti.",
    ],
  },
  "canali-distribuzione": {
    intro: "Il numero di prenotazioni per canale non dice quanto quel canale renda davvero. Per confrontare diretto, OTA, agenzie e altri intermediari bisogna arrivare al ricavo netto e capire quanta domanda e' incrementale.",
    impact: "Un canale con molto fatturato puo' avere commissioni, cancellazioni o sconti che ne riducono il valore; un canale piccolo puo' invece portare soggiorni lunghi o periodi difficili da vendere. Senza questa lettura il mix viene ottimizzato sul volume, non sul margine.",
    checks: [
      "Calcola ADR e ricavo netto dopo commissioni, marketing, sconti e costi di acquisizione per canale.",
      "Confronta cancellazione, lead time, durata soggiorno e periodo di domanda generato da ciascun canale.",
      "Verifica se un canale porta domanda nuova o intercetta clienti che avrebbero prenotato altrove.",
    ],
    approach: [
      "Crea una scheda economica omogenea per ogni canale e aggiornala con cadenza regolare.",
      "Definisci il ruolo di ciascun canale per stagione e segmento, invece di cercare un mix fisso tutto l'anno.",
      "Sposta inventario e investimenti gradualmente e misura l'effetto sul ricavo netto totale.",
    ],
  },
  extra: {
    intro: "Gli extra aumentano il valore del soggiorno solo se sono semplici da capire, acquistare e gestire. Aggiungere servizi senza conoscere margine, capacita' e momento di proposta puo' creare lavoro senza creare profitto.",
    impact: "Un servizio venduto poco puo' dipendere dal prodotto, ma anche da timing, visibilita' o processo di prenotazione. Il rischio e' valutare male l'idea senza aver misurato quante persone l'hanno davvero vista e potuta acquistare.",
    checks: [
      "Calcola margine, capacita' giornaliera e costo operativo di ogni servizio prima di promuoverlo.",
      "Misura attach rate: quanti soggiorni acquistano l'extra e in quale fase del viaggio.",
      "Verifica quali segmenti e durate di soggiorno mostrano maggiore propensione all'acquisto.",
    ],
    approach: [
      "Parti da pochi extra coerenti con il soggiorno e con margine facilmente misurabile.",
      "Proponili nel momento utile: prenotazione, pre-arrivo, check-in o durante il soggiorno a seconda del servizio.",
      "Collega vendita, disponibilita' e rendicontazione per evitare overbooking o ricavi non riconciliati.",
    ],
  },

  "richieste-ospiti": {
    intro: "Quando una richiesta puo' arrivare su cinque canali diversi, il rischio non e' soltanto dimenticarla: due persone possono rispondere allo stesso ospite senza vedere il contesto. Serve una coda unica con storico e responsabilita'.",
    impact: "Messaggi persi, risposte duplicate e tempi imprevedibili peggiorano l'esperienza e consumano ore di coordinamento interno. La frammentazione rende anche impossibile misurare il carico reale del team.",
    checks: [
      "Elenca tutti i canali attivi e verifica dove manca uno stato condiviso della conversazione.",
      "Misura richieste senza risposta e tempo medio alla prima presa in carico per canale.",
      "Controlla se email, telefono, WhatsApp e social riescono a ricondurre la conversazione allo stesso contatto.",
    ],
    approach: [
      "Porta i canali in una inbox operativa senza togliere al team le interfacce che servono davvero.",
      "Assegna conversazioni e stati in modo che sia sempre chiaro chi deve fare il prossimo passo.",
      "Automatizza classificazione e risposte semplici mantenendo escalation umana per eccezioni e richieste sensibili.",
    ],
  },
  "caselle-email": {
    intro: "Con piu' caselle, il problema nasce quando letto, risposto e risolto significano cose diverse per ogni operatore. Una inbox condivisa deve conservare cartelle, mittente corretto e traccia dell'azione effettuata.",
    impact: "Senza visibilita' comune, le email vengono duplicate, lasciate in sospeso o cercate nella casella sbagliata. Il tempo perso cresce con il numero di indirizzi e di persone che li presidiano.",
    checks: [
      "Verifica quali caselle sono condivise, quali personali e quali indirizzi devono essere usati come mittente.",
      "Controlla sincronizzazione di posta ricevuta, inviata, bozze, spam, cestino ed eventuali etichette operative.",
      "Misura quante conversazioni restano senza proprietario o vengono riaperte perche' lo stato non e' condiviso.",
    ],
    approach: [
      "Definisci una vista unica delle caselle mantenendo separazione e identita' del mittente.",
      "Usa assegnazioni, note e stati invece di spostare manualmente messaggi tra persone.",
      "Monitora errori di sincronizzazione e autorizzazioni OAuth per evitare buchi silenziosi nella posta.",
    ],
  },
  "risposte-ripetitive": {
    intro: "Domande su orari, parcheggio, check-in o servizi sono ottime candidate all'automazione, ma una risposta automatica e' utile solo se usa informazioni aggiornate e sa quando fermarsi. Il confine tra FAQ e caso particolare deve essere esplicito.",
    impact: "Copiare ogni giorno le stesse risposte sottrae tempo ai casi che richiedono davvero una persona. Automatizzare male, pero', puo' generare informazioni sbagliate con una velocita' molto maggiore.",
    checks: [
      "Raggruppa le richieste ricorrenti e misura quante volte compaiono in una settimana o mese.",
      "Verifica quali risposte dipendono da date, disponibilita', policy o dati personali e quindi non sono FAQ statiche.",
      "Controlla la fonte della knowledge base e chi e' responsabile di mantenerla aggiornata.",
    ],
    approach: [
      "Automatizza prima le domande ad alta frequenza e basso rischio con una fonte dati verificata.",
      "Imposta regole di escalation per dubbi, reclami, pagamenti e richieste che richiedono dati non disponibili.",
      "Rivedi campioni di conversazioni per correggere risposte incomplete e aggiungere nuove conoscenze validate.",
    ],
  },
  reputazione: {
    intro: "La reputazione non si gestisce soltanto rispondendo alle recensioni: bisogna capire quali temi si ripetono e se dipendono da un problema operativo reale. Rating e testo vanno letti insieme e collegati al periodo e al servizio citato.",
    impact: "Una criticita' ricorrente ignorata puo' abbassare conversione e fiducia anche quando il sito e le campagne funzionano. Risposte standardizzate senza azioni interne danno l'impressione di ascolto ma non cambiano l'esperienza.",
    checks: [
      "Raccogli recensioni per canale e classifica i temi ricorrenti, non soltanto il voto medio.",
      "Confronta trend recenti con periodi precedenti per distinguere un episodio da un problema strutturale.",
      "Verifica se i temi negativi hanno un proprietario interno e un'azione correttiva tracciata.",
    ],
    approach: [
      "Crea categorie semplici per servizio, camera, pulizia, personale, ristorazione e aspettative di prezzo.",
      "Rispondi in modo specifico e porta internamente i segnali che richiedono una correzione operativa.",
      "Usa i temi positivi confermati dagli ospiti anche nei contenuti commerciali, senza inventare claim.",
    ],
  },
  immagine: {
    intro: "Un sito puo' essere tecnicamente funzionante ma comunicare un prodotto diverso da quello che l'ospite trovera'. Foto, velocita', mobile, testi e percorso di prenotazione devono raccontare la stessa fascia e la stessa promessa della struttura.",
    impact: "Un'immagine datata abbassa fiducia e conversione prima ancora che l'utente confronti il prezzo. Se il restyling e' soltanto estetico, pero', non risolve navigazione, SEO o frizioni del booking engine.",
    checks: [
      "Confronta la resa mobile delle pagine principali con quella dei competitor che intercettano lo stesso pubblico.",
      "Verifica Core Web Vitals, leggibilita', qualita' delle immagini e chiarezza delle call to action.",
      "Controlla che camere, servizi, policy e punti di forza mostrati sul sito siano aggiornati e coerenti con le OTA.",
    ],
    approach: [
      "Definisci prima gerarchia dei contenuti e percorso verso disponibilita' o contatto, poi il nuovo stile visuale.",
      "Mantieni URL e contenuti SEO che hanno valore, usando redirect solo quando una pagina viene davvero sostituita.",
      "Misura conversione e comportamento dopo il rilascio per distinguere miglioramento estetico da risultato commerciale.",
    ],
  },
  "seo-visibilita": {
    intro: "Essere primi cercando il nome dell'hotel non significa essere visibili quando un potenziale ospite sta ancora scegliendo. Bisogna capire per quali intenti non-brand il sito compare, con quale pagina e se quella pagina risponde davvero alla ricerca.",
    impact: "Contenuti generici o piu' pagine sullo stesso intento disperdono segnali e link interni. Al contrario, una struttura chiara di pagine con scopi distinti aiuta sia il motore di ricerca sia l'utente a trovare la risposta corretta.",
    checks: [
      "Separa query brand, destinazione, servizio e problema e verifica quale URL riceve impression per ciascun gruppo.",
      "Cerca title, H1 e contenuti quasi duplicati che competono sulla stessa query invece di completarsi.",
      "Controlla indicizzazione, canonical, sitemap, redirect e link interni prima di produrre nuove pagine.",
    ],
    approach: [
      "Assegna un intento principale a ogni URL e consolida le pagine che rispondono alla stessa domanda.",
      "Crea contenuti specifici che aggiungano esperienza, dati o risposta concreta invece di variare soltanto le keyword.",
      "Collega i cluster con anchor descrittive e misura impression, click e query in Search Console nel tempo.",
    ],
  },
  "email-marketing": {
    intro: "Avere migliaia di email non equivale ad avere un database utilizzabile. Prima di inviare campagne servono origine, consenso, storico del soggiorno e segmenti che permettano di proporre qualcosa di pertinente.",
    impact: "Invii indiscriminati aumentano disiscrizioni e possono peggiorare reputazione del mittente. Inoltre nascondono il vero valore del canale perche' mescolano clienti attivi, vecchi contatti e indirizzi poco affidabili.",
    checks: [
      "Verifica consenso, fonte, data dell'ultimo soggiorno e qualita' tecnica degli indirizzi prima di segmentare.",
      "Controlla tassi di consegna, apertura, click, disiscrizione e conversione per segmento, non solo per campagna.",
      "Distingui comunicazioni transazionali da promozionali e usa mittenti coerenti con il tipo di messaggio.",
    ],
    approach: [
      "Pulisci il database e crea pochi segmenti basati su comportamento o valore reale.",
      "Costruisci lifecycle semplici: pre-arrivo, post-soggiorno, ritorno e occasioni rilevanti per il segmento.",
      "Attribuisci prenotazioni e ricavi alle campagne per capire quali automazioni meritano di essere ampliate.",
    ],
  },
  "social-marketing": {
    intro: "Pubblicare con regolarita' non e' una strategia se ogni canale racconta qualcosa di diverso o non porta a un obiettivo misurabile. Contenuti, pubblico e call to action devono essere definiti prima del calendario editoriale.",
    impact: "Il tempo speso a produrre post senza una funzione chiara diventa un costo nascosto. Inseguire ogni formato o trend puo' inoltre indebolire l'identita' della struttura e rendere impossibile capire cosa genera interesse utile.",
    checks: [
      "Identifica per ogni canale il pubblico reale, i formati che ottengono attenzione e l'azione che vuoi generare.",
      "Distingui contenuti di scoperta, prova sociale, servizio e conversione invece di pubblicare un unico tipo di post.",
      "Collega link e campagne a parametri tracciabili per separare engagement da traffico e prenotazioni.",
    ],
    approach: [
      "Definisci pochi pilastri editoriali coerenti con il posizionamento e con materiale che puoi produrre bene.",
      "Programma e riusa i contenuti adattandoli al canale senza duplicare automaticamente lo stesso post ovunque.",
      "Rivedi il piano in base a traffico qualificato, richieste e contenuti salvati o condivisi, non solo ai follower.",
    ],
  },

  margini: {
    intro: "Fatturato e utile contabile non spiegano quali reparti, canali o servizi stanno creando margine. Per decidere durante l'anno serve una vista gestionale che attribuisca costi e ricavi con regole costanti.",
    impact: "Senza margine per area si puo' crescere nei ricavi e peggiorare la redditivita'. Il problema emerge tardi, quando il bilancio fotografa decisioni che non sono piu' correggibili.",
    checks: [
      "Separa costi fissi, variabili e direttamente attribuibili per reparto o servizio.",
      "Riconcilia ricavi camere, ristorazione, spa ed extra con la stessa periodicita' dei costi.",
      "Confronta margine reale e budget evitando di giudicare un reparto solo dal suo fatturato.",
    ],
    approach: [
      "Definisci centri di responsabilita' abbastanza dettagliati da decidere ma non cosi' granulari da diventare ingestibili.",
      "Automatizza classificazioni ripetitive e porta le eccezioni a revisione umana.",
      "Trasforma gli scostamenti di margine in azioni su prezzo, acquisti, personale o mix di vendita.",
    ],
  },
  cassa: {
    intro: "La cassa risponde a una domanda diversa dal profitto: quando entrano e quando escono davvero i soldi. Prenotazioni future, depositi, scadenze fornitori e rate possono creare tensione anche in un mese economicamente positivo.",
    impact: "Scoprire un fabbisogno pochi giorni prima della scadenza limita le opzioni e rende le decisioni piu' costose. Una previsione di tesoreria serve soprattutto a vedere in anticipo i vuoti, non a produrre un numero perfetto.",
    checks: [
      "Allinea saldi, incassi attesi, depositi e pagamenti programmati con date realistiche di movimento finanziario.",
      "Separa flussi certi, probabili e discrezionali invece di sommarli in un unico totale.",
      "Individua settimane con concentrazione di fornitori, imposte, rate o investimenti rispetto agli incassi previsti.",
    ],
    approach: [
      "Costruisci un rolling cash flow per settimana o mese in base alla volatilita' della struttura.",
      "Aggiorna le date con il comportamento reale di clienti e fornitori, non soltanto con la scadenza teorica.",
      "Usa scenari per anticipare rinvii, investimenti o fabbisogni prima che diventino urgenze.",
    ],
  },
  budget: {
    intro: "Un budget utile non e' una copia dell'anno precedente aumentata di una percentuale. Deve collegare camere, prezzi, reparti, costi e investimenti a ipotesi esplicite che possano essere aggiornate quando lo scenario cambia.",
    impact: "Un budget troppo aggregato non spiega gli scostamenti; uno troppo dettagliato diventa impossibile da mantenere. In entrambi i casi il team smette di usarlo come strumento di decisione durante l'anno.",
    checks: [
      "Verifica che ricavi e costi siano costruiti con driver misurabili, non soltanto con importi annuali.",
      "Confronta actual, budget e forecast con lo stesso piano di conti e la stessa struttura di reparti.",
      "Individua le voci con maggiore sensibilita' a occupazione, prezzi, personale, energia e acquisti.",
    ],
    approach: [
      "Documenta le ipotesi di base per mese e reparto cosi' ogni scostamento ha una causa ricercabile.",
      "Aggiorna un forecast economico rolling senza riscrivere il budget originario, mantenendo entrambi i riferimenti.",
      "Concentra le revisioni sulle voci materiali e sulle decisioni ancora modificabili.",
    ],
  },
  "fatture-import": {
    intro: "Scaricare e ricopiare fatture da piu' sistemi crea lavoro a basso valore e aumenta la probabilita' di documenti mancanti o duplicati. Il primo obiettivo e' avere un flusso di import con identificatori e stato di sincronizzazione chiari.",
    impact: "Un documento duplicato altera costi e scadenze; un documento mancante rende il controllo incompleto. Se il problema viene scoperto solo a fine mese, anche la classificazione e il reporting diventano piu' lenti.",
    checks: [
      "Confronta numero e identificativo dei documenti alla fonte con quelli presenti nel sistema gestionale.",
      "Verifica come vengono trattati storni, note di credito, aggiornamenti e documenti gia' importati.",
      "Controlla errori di sincronizzazione e ultima data di import invece di assumere che il collegamento sia sempre attivo.",
    ],
    approach: [
      "Definisci una chiave univoca per evitare duplicati durante sincronizzazioni ripetute.",
      "Automatizza l'import mantenendo una coda di errori e documenti da verificare.",
      "Separa acquisizione del documento da classificazione contabile cosi' un errore non blocca l'intero flusso.",
    ],
  },
  "classificazione-spese": {
    intro: "Se lo stesso fornitore finisce in categorie diverse a seconda di chi registra la fattura, i confronti mensili perdono significato. La classificazione deve usare regole ripetibili e gestire esplicitamente le eccezioni.",
    impact: "Categorie incoerenti distorcono budget, centri di costo e analisi dei fornitori. Correggerle a consuntivo richiede tempo e rende meno credibili i report usati durante il mese.",
    checks: [
      "Cerca fornitori o descrizioni ricorrenti assegnati a conti diversi senza un motivo documentato.",
      "Verifica se una fattura contiene righe che appartengono a piu' categorie o centri di costo.",
      "Misura quante classificazioni vengono corrette manualmente dopo l'import e per quale causa.",
    ],
    approach: [
      "Crea regole per fornitore, parola chiave o tipologia mantenendo una priorita' esplicita tra regole.",
      "Invia in revisione solo i casi ambigui invece di automatizzare con bassa confidenza.",
      "Usa le correzioni validate per aggiornare le regole e ridurre progressivamente il lavoro manuale.",
    ],
  },
  "centri-costo": {
    intro: "Un centro di costo serve a rendere visibile la responsabilita' economica, non a replicare l'organigramma. Camere, F&B, spa, housekeeping e altri reparti devono ricevere costi e ricavi con criteri comprensibili e stabili.",
    impact: "Senza attribuzione coerente un reparto puo' sembrare profittevole perche' alcuni costi restano generici. Il risultato e' prendere decisioni su aperture, orari, prezzi o personale con una redditivita' incompleta.",
    checks: [
      "Elenca i costi direttamente attribuibili e quelli che richiedono una regola di riparto tra reparti.",
      "Verifica che lo stesso criterio di allocazione venga usato in budget e consuntivo.",
      "Controlla margine e costi per camera occupata, coperto, trattamento o altra unita' operativa utile al reparto.",
    ],
    approach: [
      "Definisci pochi centri di costo che corrispondano a decisioni manageriali reali.",
      "Documenta le regole di riparto dei costi comuni e mantienile confrontabili nel tempo.",
      "Analizza gli scostamenti insieme ai driver operativi per capire se cambia costo, volume o efficienza.",
    ],
  },
  scadenziario: {
    intro: "Uno scadenziario affidabile deve nascere dai documenti e dagli accordi di pagamento, non dalla memoria di chi ha ricevuto la fattura. Ogni voce deve avere importo, data, stato e collegamento alla fonte.",
    impact: "Scadenze sparse aumentano ritardi, pagamenti duplicati e sorprese di cassa. Inoltre rendono difficile capire quali impegni sono gia' approvati e quali sono ancora contestati o da verificare.",
    checks: [
      "Riconcilia fatture aperte, note di credito e pagamenti gia' effettuati per evitare residui non reali.",
      "Verifica data di scadenza, metodo di pagamento e eventuali rate per ogni documento.",
      "Distingui scaduto, in scadenza, programmato e sospeso invece di usare una sola lista cronologica.",
    ],
    approach: [
      "Genera le scadenze dai documenti importati e consenti correzioni tracciate quando l'accordo reale e' diverso.",
      "Collega lo scadenziario al cash flow per vedere l'effetto dei pagamenti nel periodo.",
      "Usa alert sulle eccezioni e sulle concentrazioni di importo, non notifiche indistinte per ogni voce.",
    ],
  },
  "bilancio-piano-conti": {
    intro: "Il piano dei conti del commercialista e la vista gestionale dell'hotel possono avere scopi diversi, ma devono essere riconciliabili. Senza un mapping stabile, ogni import di bilancio diventa un lavoro manuale e i confronti cambiano nel tempo.",
    impact: "Se una voce contabile non trova sempre lo stesso significato gestionale, budget e consuntivo non sono confrontabili. Si rischia di discutere sulla classificazione invece che sul risultato economico.",
    checks: [
      "Mappa i conti contabili alle categorie gestionali e individua conti senza corrispondenza o con piu' destinazioni possibili.",
      "Verifica coerenza tra esercizi quando il piano dei conti viene modificato o rinumerato.",
      "Controlla che il totale riconciliato coincida con la fonte prima di analizzare reparti e scostamenti.",
    ],
    approach: [
      "Mantieni un dizionario di mapping versionato tra piano contabile e piano gestionale.",
      "Gestisci esplicitamente le eccezioni nuove invece di forzarle nella categoria piu' simile.",
      "Blocca i report comparativi finche' la riconciliazione di base non e' completa e verificata.",
    ],
  },
  acquisti: {
    intro: "Un costo fuori controllo raramente appare in una singola fattura enorme: spesso cresce per frequenza, quantita' o prezzo unitario. Per individuarlo presto bisogna confrontare fornitori e categorie prima della chiusura del periodo.",
    impact: "Piccoli aumenti ripetuti su lavanderia, amenities, manutenzione o food cost possono erodere il margine senza attirare attenzione. Guardare soltanto il totale mensile spiega il problema quando e' gia' avvenuto.",
    checks: [
      "Confronta spesa per fornitore e categoria con budget, mese precedente e stesso periodo comparabile.",
      "Se disponibile, separa effetto prezzo da effetto quantita' usando unita' acquistate o driver operativi.",
      "Evidenzia nuovi fornitori, fatture anomale e aumenti ricorrenti prima dell'approvazione finale.",
    ],
    approach: [
      "Definisci soglie di attenzione per scostamento percentuale e importo materiale.",
      "Collega l'anomalia al responsabile del reparto per verificare causa operativa o errore di classificazione.",
      "Traccia l'azione correttiva e verifica nel periodo successivo se lo scostamento rientra.",
    ],
  },

  manutenzioni: {
    intro: "Una segnalazione a voce non ha priorita', proprietario ne' storico. Trasformare il guasto in un ticket consente di capire cosa e' aperto, chi lo sta gestendo e se lo stesso problema si ripete nello stesso asset o camera.",
    impact: "Le richieste perse diventano disservizi per l'ospite e interventi piu' costosi quando il guasto peggiora. Senza storico non si puo' nemmeno distinguere un episodio da un componente che andrebbe sostituito.",
    checks: [
      "Elenca le richieste aperte e verifica per ciascuna priorita', luogo, responsabile e tempo trascorso.",
      "Cerca guasti ripetuti sulla stessa camera, impianto o attrezzatura.",
      "Controlla quante segnalazioni arrivano fuori dal sistema tramite telefonate o chat personali.",
    ],
    approach: [
      "Rendi semplice la creazione del ticket da mobile con foto, voce o testo e posizione gia' contestualizzata.",
      "Assegna priorita' e responsabile con notifiche che non richiedano di rincorrere la persona a voce.",
      "Chiudi l'intervento con esito, tempo e note cosi' lo storico diventa utilizzabile per prevenzione e acquisti.",
    ],
  },
  "manutenzione-programmata": {
    intro: "La manutenzione preventiva funziona solo se la prossima scadenza nasce dalla frequenza prevista o dall'ultimo intervento registrato. Un calendario tenuto a memoria perde affidabilita' proprio quando cambiano persone o stagione.",
    impact: "Saltare un controllo puo' trasformare un'attivita' pianificabile in un fermo urgente. Fare manutenzione troppo spesso, al contrario, consuma tempo e ricambi senza un vantaggio misurato.",
    checks: [
      "Crea l'elenco degli asset con attivita' ricorrenti, frequenza, ultima esecuzione e prossima scadenza.",
      "Distingui manutenzione prescritta, preventiva interna e controlli raccomandati dal fornitore.",
      "Verifica arretrati e attivita' chiuse senza evidenza dell'intervento eseguito.",
    ],
    approach: [
      "Genera task ricorrenti automaticamente dal piano manutentivo dell'asset.",
      "Assegna procedure e checklist diverse per controllo, pulizia, sostituzione o verifica normativa.",
      "Rivedi frequenze usando guasti e storico reale, mantenendo separati gli obblighi che non possono essere modificati.",
    ],
  },
  "asset-qr": {
    intro: "Un QR sull'attrezzatura e' utile quando apre la scheda giusta con modello, posizione, storico e task aperti. Se il codice porta soltanto a un'etichetta o a un PDF isolato, non riduce davvero il tempo di intervento.",
    impact: "Cercare manuali, seriali e interventi precedenti mentre un impianto e' fermo allunga il guasto. La mancanza di storico rende anche piu' difficile decidere tra nuova riparazione e sostituzione.",
    checks: [
      "Verifica che ogni asset critico abbia identificativo univoco, posizione, categoria e dati tecnici essenziali.",
      "Controlla se foto, documenti, interventi e ricambi sono collegati allo stesso asset.",
      "Testa i QR sul posto con uno smartphone e verifica permessi e velocita' di accesso alla scheda.",
    ],
    approach: [
      "Censisci prima gli asset critici e poi estendi il sistema alle attrezzature meno rilevanti.",
      "Genera QR univoci che aprano una pagina operativa, non un documento statico difficile da aggiornare.",
      "Usa lo storico per evidenziare asset con frequenza o costo di guasto crescente.",
    ],
  },
  "fornitori-preventivi": {
    intro: "Quando ogni richiesta a un tecnico parte da una telefonata diversa, preventivo, foto e decisione restano separati. Collegare tutto allo stesso intervento permette di confrontare offerte e ricostruire perche' e' stato scelto un fornitore.",
    impact: "La frammentazione allunga i tempi di approvazione e rende difficile confrontare costi storici dello stesso lavoro. In caso di contestazione, manca una sequenza chiara di richiesta, risposta e accettazione.",
    checks: [
      "Verifica se la richiesta inviata al fornitore contiene asset, problema, foto e urgenza sufficienti per quotare.",
      "Confronta preventivi sulla stessa descrizione del lavoro e separa materiali, manodopera e tempi quando disponibili.",
      "Controlla stato di invito, risposta, approvazione e intervento senza affidarti a chat personali.",
    ],
    approach: [
      "Genera la richiesta dal ticket o asset cosi' il contesto tecnico non deve essere riscritto.",
      "Conserva preventivi e decisione nello stesso storico dell'intervento.",
      "Valuta nel tempo fornitori anche per tempi, affidabilita' e ricorrenza del problema, non solo per prezzo iniziale.",
    ],
  },
  compliance: {
    intro: "Gli adempimenti tecnici hanno frequenze, documenti e responsabilita' diverse dalle normali manutenzioni. Devono essere identificati come tali per evitare che una scadenza obbligatoria si perda in mezzo ai task ordinari.",
    impact: "Una scadenza mancata puo' generare rischio operativo e documentale oltre al semplice costo dell'intervento. Anche un controllo eseguito ma non documentato puo' risultare difficile da dimostrare in seguito.",
    checks: [
      "Censisci controlli periodici con frequenza, responsabile, fornitore e documento che prova l'esecuzione.",
      "Verifica scadenze future e arretrati separando obblighi normativi da manutenzione interna raccomandata.",
      "Controlla che verbali, certificati e allegati siano collegati all'asset o adempimento corretto.",
    ],
    approach: [
      "Crea un calendario dedicato alle scadenze tecniche con preavvisi proporzionati al tempo necessario per organizzarsi.",
      "Chiudi un adempimento solo quando esecuzione e documentazione richiesta sono entrambe presenti.",
      "Mantieni uno storico consultabile per struttura, impianto e tipologia di controllo.",
    ],
  },
  housekeeping: {
    intro: "Housekeeping in tempo reale significa sapere quali camere sono da fare, in corso, pronte o bloccate e perche'. Se il dato passa da fogli o telefonate, reception e governante lavorano su fotografie diverse della stessa giornata.",
    impact: "Una camera pronta ma non comunicata resta invendibile o ritarda il check-in; una camera dichiarata pronta troppo presto genera un problema all'ospite. Il costo nasce dal disallineamento, non solo dal tempo di pulizia.",
    checks: [
      "Confronta stato camera tra PMS, governante e reception nei momenti di maggiore turnover.",
      "Misura tempi di presa in carico, pulizia, controllo e rilascio per tipologia di camera.",
      "Registra problemi tecnici trovati durante il room check senza costringere il personale ad aprire un secondo canale.",
    ],
    approach: [
      "Usa stati semplici e condivisi aggiornabili da mobile da chi esegue realmente l'attivita'.",
      "Separa pulizia da controllo finale quando il processo richiede una verifica della governante.",
      "Collega anomalie e manutenzioni alla camera per evitare che una segnalazione operativa si perda al cambio turno.",
    ],
  },
  biancheria: {
    intro: "Contare soltanto i pezzi consegnati dalla lavanderia non spiega consumi, scarti e differenze di giacenza. Il controllo utile collega movimento di biancheria, occupazione e reparto che la utilizza.",
    impact: "Perdite piccole ma ricorrenti, sostituzioni e consumi anomali possono diventare una voce importante senza emergere dalla singola fattura. Senza dati operativi e contabili insieme e' difficile capire dove intervenire.",
    checks: [
      "Riconcilia consegne, ritiri, scarti e giacenze per articolo e periodo.",
      "Confronta consumo per camera occupata o altro driver operativo con periodi equivalenti.",
      "Verifica differenze tra documento del fornitore e movimenti registrati internamente.",
    ],
    approach: [
      "Definisci articoli e unita' di misura coerenti tra hotel e lavanderia.",
      "Registra movimenti e scarti nel momento in cui avvengono invece di ricostruirli a fine mese.",
      "Collega anomalie quantitative al costo per capire quali differenze sono economicamente rilevanti.",
    ],
  },
  "minibar-roomcheck": {
    intro: "Un controllo camera annotato su carta arriva tardi a chi deve fatturare un consumo o risolvere un'anomalia. Il dato dovrebbe nascere in camera, essere strutturato e raggiungere subito il processo successivo.",
    impact: "Minibar non addebitati, dotazioni mancanti o difetti segnalati dopo il check-out generano perdita di ricavo e lavoro di ricostruzione. Inoltre non resta uno storico utile per capire frequenze e responsabilita'.",
    checks: [
      "Elenca cosa deve essere controllato per camera e quali voci generano addebito, reintegro o manutenzione.",
      "Misura il tempo tra controllo, comunicazione alla reception e registrazione dell'eventuale consumo.",
      "Verifica che le anomalie abbiano foto o nota quando serve evitare ambiguita'.",
    ],
    approach: [
      "Trasforma il room check in una checklist mobile breve e coerente con la tipologia di camera.",
      "Instrada automaticamente consumo, reintegro e guasto verso il destinatario corretto.",
      "Usa lo storico per individuare camere o articoli con anomalie ricorrenti.",
    ],
  },
  "staff-comunicazione": {
    intro: "Un gruppo WhatsApp comunica velocemente, ma non garantisce che un'attivita' abbia responsabile, scadenza e conferma di chiusura. Conversazione e task devono restare collegati senza diventare la stessa cosa.",
    impact: "Messaggi importanti scivolano nella cronologia, i turni successivi non hanno contesto e piu' persone possono pensare che se ne stia occupando qualcun altro. Il risultato e' lavoro duplicato o non eseguito.",
    checks: [
      "Individua quante richieste operative vengono assegnate in chat senza una scadenza o una conferma di presa in carico.",
      "Verifica cosa succede al cambio turno: chi vede attivita' aperte e priorita' rimaste.",
      "Distingui comunicazioni informative da task che richiedono un'azione verificabile.",
    ],
    approach: [
      "Consenti allo staff di usare canali familiari per notifiche, ma registra il task in un sistema condiviso.",
      "Rendi visibili responsabile, priorita', stato e scadenza con pochi passaggi da mobile.",
      "Chiudi le attivita' con esito o evidenza quando serve, cosi' il turno successivo non deve ricostruire la storia.",
    ],
  },
  "turni-presenze": {
    intro: "Turni e presenze rispondono a esigenze diverse: il turno dice chi era previsto, la timbratura chi era presente. Se i due dati vivono separati, anomalie e assenze richiedono controlli manuali continui.",
    impact: "Errori di presenza si riflettono su organizzazione e amministrazione del personale. Un flusso macchinoso, pero', genera correzioni manuali che annullano il beneficio della digitalizzazione.",
    checks: [
      "Confronta turno pianificato, check-in, check-out, assenze e modifiche approvate per la stessa giornata.",
      "Verifica quali ruoli hanno obbligo di timbratura e da quali dispositivi o sedi possono effettuarla.",
      "Controlla anomalie come mancata uscita, doppia timbratura o presenza fuori finestra prevista.",
    ],
    approach: [
      "Rendi la timbratura immediata da mobile o postazione prevista, con regole chiare per chi e' obbligato.",
      "Mostra le anomalie a chi deve correggerle invece di modificare silenziosamente il dato grezzo.",
      "Collega turni, assenze e presenze mantenendo storico delle approvazioni e delle rettifiche.",
    ],
  },
  personale: {
    intro: "La difficolta' nel trovare e trattenere personale puo' dipendere da mercato, turni, mansioni, onboarding o organizzazione interna. Prima di aumentare gli annunci serve capire dove si interrompe il percorso tra candidatura e permanenza.",
    impact: "Posti scoperti aumentano straordinari e pressione sul team esistente; turnover elevato moltiplica selezione e formazione. Senza dati sul punto di uscita, ogni nuova ricerca ripete lo stesso processo.",
    checks: [
      "Misura tempo di copertura, fonti delle candidature, accettazione delle offerte e abbandono nei primi mesi.",
      "Confronta mansione reale, orari e aspettative comunicate nell'annuncio o colloquio.",
      "Raccogli motivi di rifiuto e uscita in categorie semplici per distinguere mercato e problemi organizzativi.",
    ],
    approach: [
      "Rendi ruolo, turnazione e responsabilita' espliciti prima di ampliare la ricerca.",
      "Standardizza onboarding e primi giorni per ridurre dipendenza dalla persona che affianca il nuovo assunto.",
      "Intervieni sui motivi di uscita ricorrenti e misura se il turnover cambia dopo la correzione.",
    ],
  },
  formazione: {
    intro: "Un team autonomo non deve conoscere tutto, ma deve sapere quali dati guardare, quale decisione puo' prendere e quando deve escalare. La formazione funziona quando e' legata ai processi quotidiani e non resta una lezione isolata.",
    impact: "Se soltanto una o due persone sanno interpretare dati e procedure, ferie o turnover diventano un rischio operativo. La dipendenza da competenze non documentate rallenta anche l'adozione di nuovi strumenti.",
    checks: [
      "Elenca decisioni ricorrenti che oggi richiedono sempre la stessa persona esperta.",
      "Verifica se esistono procedure, esempi e soglie che permettano al team di agire in casi normali.",
      "Misura errori o richieste di aiuto dopo la formazione per capire quali concetti non sono stati trasferiti.",
    ],
    approach: [
      "Costruisci moduli brevi sui casi reali della struttura, usando dati e strumenti che il team vede ogni giorno.",
      "Affianca alla teoria checklist e criteri decisionali riutilizzabili durante il lavoro.",
      "Verifica l'autonomia con esercizi e casi successivi, aggiornando la formazione quando cambia il processo.",
    ],
  },

  strumenti: {
    intro: "Il problema di molti software non e' il numero in se', ma quante volte lo stesso dato deve essere ricopiato e quante fonti possono dichiararsi corrette. La mappa delle duplicazioni viene prima della scelta di una nuova piattaforma.",
    impact: "Ogni passaggio manuale introduce ritardo e possibilita' di divergenza. Quando due sistemi mostrano valori diversi, il team perde tempo a riconciliare anziche' usare il dato per decidere.",
    checks: [
      "Mappa dati che vengono copiati tra PMS, CRM, contabilita', fogli e strumenti operativi.",
      "Per ogni dato stabilisci quale sistema e' fonte primaria e quali dovrebbero soltanto riceverlo.",
      "Conta esportazioni CSV, import manuali e riconciliazioni richieste in una settimana normale.",
    ],
    approach: [
      "Elimina prima le duplicazioni che generano piu' errori o piu' tempo, non necessariamente quelle tecnicamente piu' facili.",
      "Integra tramite API o webhook i sistemi che hanno una responsabilita' chiara e continuano a servire bene.",
      "Mantieni log e controlli di sincronizzazione per sapere quando un dato non e' arrivato a destinazione.",
    ],
  },
  multi: {
    intro: "Con piu' strutture, confrontare risultati ha senso solo se KPI, piano dei conti e processi usano definizioni comuni. Una dashboard di gruppo costruita su dati non omogenei rende il confronto piu' elegante ma non piu' corretto.",
    impact: "Differenze di metodo tra hotel possono nascondere problemi o far sembrare migliore una struttura soltanto per come registra il dato. Anche utenti e permessi diventano piu' complessi quando le persone lavorano su piu' property.",
    checks: [
      "Verifica che ADR, occupazione, margini e centri di costo abbiano definizioni confrontabili tra strutture.",
      "Controlla utenti con accesso a piu' property e isolamento dei dati per societa', ruolo e responsabilita'.",
      "Individua processi locali che devono restare diversi e quelli che possono essere standardizzati a livello di gruppo.",
    ],
    approach: [
      "Definisci un modello dati e un set di KPI comuni prima di costruire il reporting centrale.",
      "Mantieni configurazioni locali dove il mercato o l'operativita' lo richiedono, documentando le eccezioni.",
      "Crea viste di gruppo che permettano confronto e drill-down senza mescolare ownership o dati sensibili.",
    ],
  },
  "pms-accesso": {
    intro: "Aprire il PMS per ogni informazione interrompe il flusso di lavoro quando il dato serve dentro CRM, inbox o attivita' operative. L'obiettivo non e' duplicare il gestionale, ma portare contesto e azioni nel punto in cui servono.",
    impact: "Continui cambi di finestra aumentano tempi e errori di copia, soprattutto durante telefonate o richieste dell'ospite. Replicare troppi dati, pero', crea un secondo problema di sincronizzazione.",
    checks: [
      "Elenca le informazioni PMS consultate piu' spesso fuori dal gestionale e per quale azione vengono usate.",
      "Verifica se esistono API, iframe o deep link sicuri prima di copiare dati in un nuovo database.",
      "Controlla ruoli e permessi: non tutti gli utenti che vedono il CRM devono necessariamente vedere ogni dato PMS.",
    ],
    approach: [
      "Porta nel workspace solo il contesto necessario oppure incorpora l'accesso quando e' tecnicamente appropriato.",
      "Mantieni il PMS come fonte ufficiale per i dati di prenotazione che non devono essere duplicati.",
      "Misura i passaggi eliminati e verifica che l'integrazione non introduca dati vecchi o autorizzazioni eccessive.",
    ],
  },
  "dati-manuali": {
    intro: "Un file esportato e' gia' una fotografia del passato. Se pricing, controllo o CRM dipendono da import manuali, la qualita' della decisione varia con la puntualita' di chi aggiorna il dato.",
    impact: "Oltre al tempo, gli aggiornamenti manuali creano versioni diverse dello stesso dataset e rendono difficile sapere quale sia l'ultima. Un'automazione senza monitoraggio puo' comunque fallire in silenzio e produrre lo stesso effetto.",
    checks: [
      "Elenca import ed export ricorrenti con frequenza, proprietario, fonte e destinazione.",
      "Misura il ritardo medio tra aggiornamento alla fonte e disponibilita' del dato nel sistema che lo usa.",
      "Verifica duplicati, record mancanti e cambi di formato che oggi vengono corretti manualmente.",
    ],
    approach: [
      "Automatizza prima i flussi ad alta frequenza e con schema stabile usando identificatori idempotenti.",
      "Aggiungi log, ultima sincronizzazione e coda errori visibile invece di considerare il job sempre riuscito.",
      "Definisci procedure di recovery e riconciliazione per quando la fonte o l'API non sono disponibili.",
    ],
  },
  "dashboard-unica": {
    intro: "Una dashboard unica e' utile solo se riduce il tempo per arrivare a una decisione. Copiare tutti i grafici dei singoli strumenti in un'altra schermata crea un nuovo cruscotto da consultare senza risolvere la frammentazione.",
    impact: "Ricostruire manualmente il quadro rende le riunioni dipendenti da file preparati ad hoc e dati con orari diversi. Il rischio e' discutere numeri non allineati o arrivare tardi sull'anomalia.",
    checks: [
      "Elenca le decisioni ricorrenti e quali KPI servono davvero per prenderle.",
      "Verifica fonte, timestamp e definizione di ogni indicatore che vuoi riunire.",
      "Individua KPI duplicati con valori diversi tra strumenti e risolvi la fonte prima della visualizzazione.",
    ],
    approach: [
      "Progetta la dashboard per domanda manageriale, non per sistema di origine.",
      "Mostra pochi KPI sintetici con possibilita' di approfondire nella fonte quando serve.",
      "Evidenzia scostamenti e anomalie invece di costringere l'utente a cercarli tra decine di grafici.",
    ],
  },
  "suite-login": {
    intro: "Account duplicati diventano un rischio quando una persona cambia ruolo o lascia l'azienda e deve essere rimossa da piu' applicazioni. Un'identita' condivisa deve semplificare accesso senza appiattire i permessi delle singole piattaforme.",
    impact: "Password multiple aumentano reset e credenziali dimenticate; provisioning manuale crea utenti mancanti o accessi rimasti attivi. Un SSO progettato male puo' invece estendere un permesso oltre il necessario.",
    checks: [
      "Mappa utenti, email, tenant e ruoli presenti nelle diverse piattaforme e individua duplicati o incongruenze.",
      "Verifica quali applicazioni condividono davvero la stessa organizzazione e quali richiedono isolamento separato.",
      "Controlla cosa succede a disattivazione, cambio ruolo e revoca di un utente su tutte le app collegate.",
    ],
    approach: [
      "Definisci un'identita' centrale stabile e collegamenti espliciti agli account applicativi esistenti.",
      "Propaga autenticazione e lifecycle dell'utente mantenendo autorizzazioni specifiche per modulo e tenant.",
      "Testa login, logout, revoca e casi di account preesistenti prima di automatizzare la creazione massiva.",
    ],
  },
  integrazioni: {
    intro: "Due software possono avere API e continuare a non integrarsi bene se non e' chiaro chi crea il dato, chi lo aggiorna e come gestire conflitti. L'integrazione e' prima un contratto di processo e poi una chiamata tecnica.",
    impact: "Sincronizzazioni parziali generano fiducia falsa: il sistema sembra collegato finche' un record manca o viene sovrascritto. Senza log e identificatori comuni, ricostruire il problema puo' essere piu' costoso del lavoro manuale eliminato.",
    checks: [
      "Definisci oggetti e campi da scambiare, direzione del flusso e fonte autorevole per ogni dato.",
      "Verifica autenticazione, limiti API, webhook, frequenza e comportamento in caso di timeout o rate limit.",
      "Stabilisci chiavi univoche e regole per aggiornamenti, cancellazioni e record gia' esistenti.",
    ],
    approach: [
      "Documenta il contratto dati e i casi di errore prima di sviluppare il connettore.",
      "Rendi le operazioni idempotenti e osservabili con log, retry controllati e coda degli errori.",
      "Testa con dati reali rappresentativi, inclusi duplicati e casi limite, prima di affidare il processo all'automazione.",
    ],
  },
  "software-standard": {
    intro: "Un software standard diventa un problema quando obbliga il team a costruire fogli, chat e procedure parallele per completare il processo. Prima di sviluppare su misura bisogna isolare il requisito davvero mancante da semplici preferenze di interfaccia.",
    impact: "Personalizzare troppo presto puo' creare costi e manutenzione inutili; adattarsi a un prodotto inadatto puo' invece rendere permanente un flusso inefficiente. La decisione corretta dipende dal vantaggio operativo del requisito non coperto.",
    checks: [
      "Descrivi il processo attuale, il risultato atteso e il punto esatto in cui il software standard costringe a uscire dal flusso.",
      "Verifica configurazioni, API ed estensioni disponibili prima di concludere che serva un nuovo applicativo.",
      "Calcola frequenza, utenti coinvolti, errori e tempo perso per stimare il valore reale della personalizzazione.",
    ],
    approach: [
      "Mantieni standard le parti commodity e progetta su misura soltanto il differenziale che crea valore.",
      "Definisci integrazioni e ownership dei dati prima dell'interfaccia del nuovo modulo.",
      "Rilascia una prima versione sul processo critico e misura l'adozione prima di estendere il perimetro.",
    ],
  },
  "report-condivisione": {
    intro: "Un report ricostruito a mano ogni settimana e' un processo, non un documento. Per automatizzarlo bisogna fissare fonti, definizioni, periodo e destinatari cosi' lo stesso numero non cambia in base a chi prepara il file.",
    impact: "Copiare dati in slide o fogli consuma tempo e introduce versioni diverse del risultato. Se il destinatario non puo' risalire alla fonte o alla data di aggiornamento, il report perde affidabilita'.",
    checks: [
      "Elenca report ricorrenti, destinatari, frequenza e decisione che ciascuno dovrebbe supportare.",
      "Verifica che KPI e tabelle abbiano fonte, periodo e regole di calcolo stabili.",
      "Individua quali parti richiedono commento umano e quali possono essere generate automaticamente senza perdere contesto.",
    ],
    approach: [
      "Crea un modello unico alimentato dalle fonti corrette invece di copiare dati in un nuovo file ogni volta.",
      "Genera PDF o viste condivisibili con timestamp e perimetro dei dati chiaramente visibili.",
      "Mantieni note e interpretazione separate dal dato di base cosi' l'automazione non inventa spiegazioni non verificate.",
    ],
  },
}
