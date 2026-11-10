"use server";

import {noul, choice, score, TypeSafeClient, NoulQuestion, ChoiceQuestion, ScoreQuestion} from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api",
});

export async function processClaim(claim: string) {
    const response = await client.systemOne({
        state: {
            claim,
        },
        questions: {
            diseaseClaim: noul(
                "Does `claim` state or imply treatment, cure, diagnosis, or prevention of disease?"
            ),
            claimType: choice("Which category best describes `claim`?", {
                not_a_claim: "The sentence does not make a product claim.",
                general_wellbeing: "A broad claim about general health or wellbeing.",
                structure_function:
                    "A claim about supporting normal structure or function of the body.",
                disease_claim:
                    "A claim stating or implying diagnosis, treatment, cure, or prevention of disease.",
                efficacy_claim:
                    "A claim that the product produces a specific beneficial result.",
                other_product_claim:
                    "A product claim that does not fit the other categories.",
            }),
            risk: score("How severe is the regulatory risk presented by `claim`?", [
                "Not a claim or no meaningful regulatory concern.",
                "Low regulatory risk.",
                "Moderate risk and potentially requires review.",
                "High regulatory risk.",
                "Very high risk, such as a strong disease-treatment or guaranteed-outcome claim."
            ])
        },
    });

    return {
        message: response,
    };
}

export async function processClaims(claims: string[]) {
    const cleanClaims = claims.map((claim) => claim.trim()).filter(Boolean);
    if (cleanClaims.length === 0) {
        throw new Error("Add at least one product claim to analyze.");
    }

    const questions: {
        [key: string]: NoulQuestion | ChoiceQuestion | ScoreQuestion
    } = {}

    cleanClaims.forEach((_, index) => {
        questions[`claim_${index}_disease`] = noul(
            `Does \`claims[${index}]\` state or imply treatment, cure, diagnosis, or prevention of disease?`
        );
        questions[`claim_${index}_type`] = choice(`Which category best describes \`claims[${index}]\`?`, {
            not_a_claim: "The sentence does not make a product claim.",
            general_wellbeing: "A broad claim about general health or wellbeing.",
            structure_function:
                "A claim about supporting normal structure or function of the body.",
            disease_claim:
                "A claim stating or implying diagnosis, treatment, cure, or prevention of disease.",
            efficacy_claim:
                "A claim that the product produces a specific beneficial result.",
            other_product_claim:
                "A product claim that does not fit the other categories.",
        });
        questions[`claim_${index}_risk`] = score(`How severe is the regulatory risk presented by \`claims[${index}]\`?`, [
            "Not a claim or no meaningful regulatory concern.",
            "Low regulatory risk.",
            "Moderate risk and potentially requires review.",
            "High regulatory risk.",
            "Very high risk, such as a strong disease-treatment or guaranteed-outcome claim."
        ]);
    })
    const response = await client.systemOne({
        state: {
            claims: cleanClaims,
        },
        questions,
    });

    return {
        model: response.model,
        usage: response.usage,
        results: cleanClaims.map((claim, index) => {
            const disease = response.answers[`claim_${index}_disease`] as { noul: number };
            const type = response.answers[`claim_${index}_type`] as { choice: string; confidence: number };
            const risk = response.answers[`claim_${index}_risk`] as { score: number; confidence: number };
            const riskLabels = ["No concern", "Low", "Moderate", "High", "Very high"];

            return {
                claim,
                diseaseLikelihood: disease.noul,
                claimType: type.choice,
                claimTypeConfidence: type.confidence,
                riskScore: risk.score,
                riskConfidence: risk.confidence,
                riskLabel: riskLabels[Math.round(risk.score)] ?? "Review",
            };
        }),
    };
}
