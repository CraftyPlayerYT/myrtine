import assert from "node:assert/strict";
import test from "node:test";
import {
  construirePayloadDiagnostic,
  DiagnosticSubmissionError,
  soumettreDiagnostic
} from "./diagnostics.js";

test("adapte les noms du formulaire au contrat serveur", () => {
  assert.deepEqual(
    construirePayloadDiagnostic({ ca: "1000", budget_montant: "500", depenses_types: ["Machine"] }),
    {
      objet_projet: "",
      porteur_projet: "",
      secteur: "",
      localisation: "",
      effectif: "",
      chiffre_affaires: "1000",
      budget_previsionnel: "500",
      calendrier: "",
      depenses_concernees: ["Machine"],
      informations_supplementaires: "",
      nom: "",
      prenom: "",
      email: "",
      telephone: ""
    }
  );
});

test("accepte uniquement la confirmation recue", async () => {
  const result = await soumettreDiagnostic({}, {
    fetchImpl: async () => new Response(JSON.stringify({ etat_de_la_requete: "recue", diagnostic_id: "diag-1" }), {
      status: 202,
      headers: { "content-type": "application/json" }
    })
  });
  assert.equal(result.diagnostic_id, "diag-1");
});

test("transforme les champs manquants en erreur lisible", async () => {
  await assert.rejects(
    () => soumettreDiagnostic({}, {
      fetchImpl: async () => new Response(JSON.stringify({
        etat_de_la_requete: "informations_manquantes",
        champs_manquants: ["nom", "email"]
      }), { status: 400, headers: { "content-type": "application/json" } })
    }),
    (error) => error instanceof DiagnosticSubmissionError && /nom, email/.test(error.message)
  );
});
