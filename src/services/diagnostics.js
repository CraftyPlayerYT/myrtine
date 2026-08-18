export const DIAGNOSTIC_ENDPOINT = "https://serveur.myrtine.fr/diagnostic-flash/site";

export class DiagnosticSubmissionError extends Error {
  constructor(message, { status = 0, code = "erreur_reseau" } = {}) {
    super(message);
    this.name = "DiagnosticSubmissionError";
    this.status = status;
    this.code = code;
  }
}

export function construirePayloadDiagnostic(answers) {
  const data = answers || {};
  return {
    objet_projet: data.objet_projet || "",
    porteur_projet: data.porteur_projet || "",
    secteur: data.secteur || "",
    localisation: data.localisation || "",
    effectif: data.effectif || "",
    chiffre_affaires: data.ca || "",
    budget_previsionnel: data.budget_montant || "",
    calendrier: data.calendrier || "",
    depenses_concernees: Array.isArray(data.depenses_types) ? data.depenses_types : [],
    nom: data.nom || "",
    prenom: data.prenom || "",
    email: data.email || "",
    telephone: data.telephone || ""
  };
}

export function messageErreurDiagnostic(response, data) {
  const etat = String(data?.etat_de_la_requete || "");
  if (etat === "informations_manquantes") {
    const champs = Array.isArray(data?.champs_manquants) ? data.champs_manquants.join(", ") : "";
    return champs
      ? `Certaines informations obligatoires sont absentes : ${champs}.`
      : "Certaines informations obligatoires sont absentes. Vérifiez le formulaire.";
  }
  if (etat === "email_invalide") return "L'adresse e-mail renseignée n'est pas valide.";
  if (etat === "stockage_temporairement_indisponible") {
    return "Votre demande n'a pas pu être enregistrée. Réessayez dans quelques minutes.";
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  return `Le serveur n'a pas pu enregistrer la demande (HTTP ${response.status}).`;
}

export async function soumettreDiagnostic(answers, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl(DIAGNOSTIC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(construirePayloadDiagnostic(answers)),
    signal
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new DiagnosticSubmissionError(messageErreurDiagnostic(response, data), {
      status: response.status,
      code: String(data?.etat_de_la_requete || "erreur_serveur")
    });
  }
  if (String(data?.etat_de_la_requete || "").toLowerCase() !== "recue") {
    throw new DiagnosticSubmissionError(
      "Le serveur a répondu, mais n'a pas confirmé l'enregistrement de la demande.",
      { status: response.status, code: "confirmation_absente" }
    );
  }
  return data;
}
