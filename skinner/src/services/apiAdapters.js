import { cleanText } from "@/lib/formValidation";
function firstValue(source, keys, fallback = null) { if (!source || typeof source !== "object") return fallback; for (const key of keys) { const value = source[key]; if (value !== undefined && value !== null && value !== "") return value; } return fallback; }
export function toArray(payload) { if (Array.isArray(payload)) return payload; if (Array.isArray(payload?.data)) return payload.data; if (Array.isArray(payload?.data?.data)) return payload.data.data; if (Array.isArray(payload?.items)) return payload.items; if (Array.isArray(payload?.results)) return payload.results; if (Array.isArray(payload?.doctors)) return payload.doctors; if (Array.isArray(payload?.appointments)) return payload.appointments; if (Array.isArray(payload?.messages)) return payload.messages; if (Array.isArray(payload?.chats)) return payload.chats; if (Array.isArray(payload?.conversations)) return payload.conversations; return []; }
export function extractId(payload, keys = []) { const possible = [...keys, "id", "analysis_id", "appointment_id", "chat_id", "conversation_id"]; return firstValue(payload, possible, "") || firstValue(payload?.data, possible, "") || firstValue(payload?.data?.data, possible, ""); }
export function initialsFromName(name = "") { const parts = cleanText(name, 80).split(" ").filter(Boolean); return parts.length ? parts.slice(0, 3).map((p) => p[0]?.toUpperCase()).join("") : "DR"; }
export function adaptDoctor(apiDoctor = {}, fallback = {}) { const id = firstValue(apiDoctor, ["medical_syndicate_id_card", "doctor_id", "id", "_id"], fallback.id || null); const name = firstValue(apiDoctor, ["name", "doctor_name", "full_name"], fallback.name || null); const spec = firstValue(apiDoctor, ["specialization", "specialty"], fallback.specialty || null); const exp = firstValue(apiDoctor, ["year_of_experience", "years_of_experience", "experience"], null); const feeValue = firstValue(apiDoctor, ["consultation_fee", "fee", "price"], fallback.fee != null ? fallback.fee : null); const clinic = firstValue(apiDoctor, ["clinic_address", "clinic", "address"], fallback.clinic || null); const fee = feeValue != null ? (String(feeValue).startsWith("$") ? String(feeValue) : `$${feeValue}`) : null; const experience = exp != null ? `${exp} years experience` : fallback.experience || null; return { ...fallback, raw: apiDoctor, id, medical_syndicate_id_card: id, initials: initialsFromName(name), name, specialty: spec, rating: firstValue(apiDoctor, ["rating"], fallback.rating || null), reviews: firstValue(apiDoctor, ["reviews", "reviews_count"], fallback.reviews || null), experience, clinic, availability: firstValue(apiDoctor, ["availability", "available_at"], fallback.availability || null), fee, tags: [spec, clinic].filter(Boolean).slice(0, 2) }; }

/**
 * Patient-friendly disease information for each of the 15 conditions
 * covered by the Skinner AI model.
 */
export const DISEASE_INFO = {
	Moles: {
		description:
			"Moles (melanocytic nevi) are common skin growths that appear as small, dark brown spots caused by clusters of pigment-forming cells. Most moles are harmless and rarely become cancerous. They can appear anywhere on the body, alone or in groups, and most develop by age 40. While the vast majority of moles are benign, it is important to monitor them for changes.",
		recommendations: [
			"Monitor your moles regularly for changes in size, shape, color, or symmetry (use the ABCDE rule)",
			"Protect moles from sun exposure by applying sunscreen (SPF 30+) and wearing protective clothing",
			"Do not attempt to remove or scratch moles at home — this may cause infection or scarring",
			"See a dermatologist if a mole changes appearance, bleeds, itches, or becomes painful",
			"Consider annual skin exams with a dermatologist, especially if you have many moles or a family history of skin cancer",
		],
	},
	Acne: {
		description:
			"Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells. It often causes pimples, blackheads, or whiteheads and typically appears on the face, forehead, chest, upper back, and shoulders. Acne is most common among teenagers but can affect people of all ages.",
		recommendations: [
			"Wash the affected area gently twice daily with a mild, fragrance-free cleanser",
			"Avoid touching, picking, or squeezing pimples to prevent scarring and infection",
			"Use non-comedogenic (won't clog pores) moisturizers and sunscreens",
			"Consider over-the-counter treatments containing benzoyl peroxide or salicylic acid",
			"Consult a dermatologist if acne is severe, painful, or not improving with basic care",
		],
	},
	Actinic_Keratosis: {
		description:
			"Actinic keratosis is a rough, scaly patch on the skin caused by years of sun exposure. It usually appears on sun-exposed areas like the face, lips, ears, forearms, scalp, and neck. While it is not cancer, it is considered a precancerous condition because it can sometimes develop into squamous cell carcinoma if left untreated.",
		recommendations: [
			"Apply broad-spectrum sunscreen (SPF 30+) daily, even on cloudy days",
			"Wear protective clothing, hats, and sunglasses when outdoors",
			"Schedule a dermatology appointment for professional evaluation as soon as possible",
			"Avoid tanning beds and prolonged direct sun exposure",
			"Monitor the affected area for changes in size, color, or texture and report them to your doctor",
		],
	},
	Bullous: {
		description:
			"Bullous disease refers to a group of conditions that cause large, fluid-filled blisters on the skin. These blisters can appear on areas of skin that flex, such as the lower abdomen, upper thighs, or armpits. The condition can be uncomfortable and may increase the risk of skin infections if blisters break open.",
		recommendations: [
			"Do not pop or puncture blisters — keep them intact to prevent infection",
			"Keep the affected area clean and gently covered with sterile bandages",
			"Use prescribed topical medications as directed by your doctor",
			"Avoid activities that may cause friction or trauma to the blistered areas",
			"Seek medical attention promptly, as this condition often requires prescription treatment",
		],
	},
	DrugEruption: {
		description:
			"A drug eruption is a skin reaction caused by a medication you are taking. It can appear as red rashes, hives, blisters, or widespread skin irritation. The reaction may start within days of beginning a new medication or even after taking a medicine for a long time. Symptoms often improve once the causing medication is stopped.",
		recommendations: [
			"Make a list of all medications and supplements you are currently taking",
			"Do not stop any prescribed medication without consulting your doctor first",
			"Contact your healthcare provider immediately to identify and review the suspected medication",
			"Apply cool compresses or calamine lotion to soothe itchy or irritated skin",
			"Seek emergency care if you experience difficulty breathing, swelling of the face or throat, or widespread blistering",
		],
	},
	Eczema: {
		description:
			"Eczema (atopic dermatitis) is a chronic condition that makes the skin red, itchy, and inflamed. It often appears in patches on the hands, feet, ankles, wrists, neck, upper chest, eyelids, and inside the bend of elbows and knees. While there is no cure, proper management can control flare-ups and keep the skin comfortable.",
		recommendations: [
			"Keep the skin well moisturized with fragrance-free emollients, especially after bathing",
			"Avoid known triggers such as harsh soaps, detergents, extreme temperatures, and stress",
			"Take lukewarm (not hot) showers and baths, and keep them short",
			"Consider over-the-counter hydrocortisone cream for mild itching and inflammation",
			"Consult a dermatologist if symptoms persist, worsen, or interfere with your daily life",
		],
	},
	Lichen: {
		description:
			"Lichen planus is an inflammatory condition that affects the skin, hair, nails, and mucous membranes. On the skin, it usually appears as purplish, flat-topped, itchy bumps. It can also cause lacy white patches, sores, or painful areas in the mouth. The condition is not contagious and is thought to be related to the immune system.",
		recommendations: [
			"Avoid scratching the affected areas to prevent further irritation and scarring",
			"Use mild, fragrance-free skin care products and avoid harsh chemicals",
			"Apply prescribed topical corticosteroids to reduce inflammation and itching",
			"If mouth sores are present, avoid spicy and acidic foods that may worsen pain",
			"Schedule a follow-up with a dermatologist for proper management and monitoring",
		],
	},
	Lupus: {
		description:
			"Lupus skin involvement (cutaneous lupus) causes various rashes and sores on the skin, including the characteristic butterfly-shaped rash across the cheeks and nose. It is an autoimmune condition where the body's immune system attacks healthy tissue. Skin symptoms may be the first sign of lupus and can be triggered or worsened by sun exposure.",
		recommendations: [
			"Protect your skin strictly from the sun — use SPF 50+ sunscreen and reapply every 2 hours",
			"Wear protective clothing, wide-brimmed hats, and UV-blocking sunglasses",
			"Consult a rheumatologist or dermatologist for a comprehensive evaluation",
			"Track your symptoms, flare-ups, and potential triggers in a daily journal",
			"Follow up regularly with your healthcare team, as lupus may affect other organs beyond the skin",
		],
	},
	Rosacea: {
		description:
			"Rosacea is a chronic skin condition that causes redness, visible blood vessels, and sometimes small, pus-filled bumps on the face. It most commonly affects the cheeks, nose, chin, and forehead. Symptoms may flare up for weeks or months and then go away for a while. Without treatment, rosacea tends to worsen over time.",
		recommendations: [
			"Identify and avoid personal triggers such as hot drinks, spicy food, alcohol, and extreme temperatures",
			"Use gentle, fragrance-free skincare products designed for sensitive skin",
			"Apply a broad-spectrum sunscreen (SPF 30+) daily, as sun exposure is a major trigger",
			"Avoid rubbing or scrubbing the face — pat dry gently after washing",
			"See a dermatologist for prescription treatments that can effectively control symptoms",
		],
	},
	Seborrh_Keratoses: {
		description:
			"Seborrheic keratosis is a common, harmless (non-cancerous) skin growth that usually appears as a brown, black, or tan waxy, slightly raised patch. They often look as if they are stuck on the skin and can appear on the face, chest, shoulders, or back. While they are not dangerous, they can sometimes be confused with skin cancer.",
		recommendations: [
			"No treatment is usually necessary since seborrheic keratoses are benign",
			"Do not scratch or pick at the growths, as this may cause irritation or infection",
			"Monitor any growth for sudden changes in size, color, shape, or bleeding",
			"See a dermatologist if the growth becomes irritated, bleeds, or you are uncertain about its nature",
			"If cosmetically bothersome, ask your doctor about safe removal options such as cryotherapy",
		],
	},
	SkinCancer: {
		description:
			"The analysis has detected features consistent with skin cancer. Skin cancer is the abnormal growth of skin cells, most often developing on skin exposed to the sun. Early detection and treatment are critical for the best outcomes. Please do not delay — a professional medical evaluation is strongly recommended.",
		recommendations: [
			"Schedule an urgent appointment with a dermatologist or oncologist as soon as possible",
			"Do not attempt to treat, remove, or biopsy the lesion yourself",
			"Protect the area from further sun exposure while awaiting your appointment",
			"Take clear photos of the lesion to document any changes over the coming days",
			"Stay calm — many skin cancers are highly treatable when caught early with professional care",
		],
	},
	Tinea: {
		description:
			"Tinea (ringworm) is a common fungal infection of the skin, not caused by a worm despite the name. It usually appears as a circular, red, scaly, and itchy patch with clearer skin in the center, forming a ring shape. It can appear on the body, scalp, feet (athlete's foot), or groin area and is contagious through skin contact or shared items.",
		recommendations: [
			"Apply over-the-counter antifungal cream, lotion, or spray as directed on the packaging",
			"Keep the affected area clean and dry — fungi thrive in warm, moist environments",
			"Avoid sharing towels, clothing, or personal items to prevent spreading the infection",
			"Wash your hands thoroughly after touching the affected area",
			"See a doctor if the infection does not improve within 2 weeks or spreads to larger areas",
		],
	},
	Unknown_Normal: {
		description:
			"The AI analysis did not detect any of the 15 specific skin conditions it is trained to identify. This could mean the skin appears normal, or the condition is outside the scope of what the AI model covers. This result does not rule out all skin conditions.",
		recommendations: [
			"If you have any symptoms or concerns, consult a dermatologist for a thorough examination",
			"Continue regular skincare routines and sun protection habits",
			"Monitor your skin for any new or changing spots, moles, or rashes",
			"Consider re-scanning if the image quality was poor, blurry, or taken in bad lighting",
			"Remember, the AI covers 15 specific conditions — other skin issues may still be present",
		],
	},
	Vasculitis: {
		description:
			"Vasculitis is a condition involving inflammation of blood vessels. When it affects the skin, it can cause red or purple spots, bumps, or patches. In some cases, the skin changes may indicate a more widespread condition affecting other organs. The severity varies widely depending on the type and extent of blood vessel involvement.",
		recommendations: [
			"Seek medical attention promptly, as vasculitis may require blood tests and further evaluation",
			"Avoid activities that worsen swelling — elevate affected limbs when resting",
			"Do not ignore symptoms like fever, fatigue, joint pain, or numbness alongside skin changes",
			"Follow your doctor's prescribed treatment plan, which may include anti-inflammatory medications",
			"Keep regular follow-up appointments to monitor the condition and adjust treatment as needed",
		],
	},
	Vitiligo: {
		description:
			"Vitiligo is a condition in which patches of skin lose their color (pigment), resulting in smooth, white areas. It occurs when the cells that produce melanin (skin pigment) are destroyed by the immune system. Vitiligo can affect any area of the body and may spread over time. It is not contagious or physically harmful, but can have an emotional impact.",
		recommendations: [
			"Apply sunscreen (SPF 30+) to depigmented areas, as they burn easily without melanin protection",
			"Consult a dermatologist to discuss treatment options such as topical corticosteroids or phototherapy",
			"Use cosmetic camouflage products if the patches cause cosmetic concern",
			"Protect your skin from cuts and sunburns, which may trigger new patches (Koebner phenomenon)",
			"Consider emotional or psychological support if vitiligo is affecting your self-esteem or well-being",
		],
	},
	Warts: {
		description:
			"Warts are small, rough, grainy skin growths caused by the human papillomavirus (HPV). They are most common on the fingers and hands but can appear anywhere on the body. Warts are contagious and can spread through direct skin contact or contaminated surfaces. Most warts are harmless and may go away on their own over time, though treatment can speed up removal.",
		recommendations: [
			"Avoid picking, scratching, or biting warts to prevent spreading to other areas",
			"Try over-the-counter treatments containing salicylic acid as a first step",
			"Keep the area clean and covered with a bandage to reduce the risk of spreading",
			"Do not share personal items like towels, razors, or nail clippers",
			"See a dermatologist if warts are painful, spreading rapidly, or located on the face or genitals",
		],
	},
};

/** Look up disease info by a condition name (case-insensitive, flexible matching). */
export function getDiseaseInfo(condition) {
	if (!condition) return null;
	const key = String(condition).trim();
	// Direct match
	if (DISEASE_INFO[key]) return DISEASE_INFO[key];
	// Case-insensitive match
	const lower = key.toLowerCase().replace(/[\s_-]+/g, "");
	for (const [k, v] of Object.entries(DISEASE_INFO)) {
		if (k.toLowerCase().replace(/[\s_-]+/g, "") === lower) return v;
	}
	return null;
}

function parseAnalysisString(value = "") {
	const raw = String(value).trim();
	const match = /Predicted\s*class\s*:\s*([^,]+),\s*Confidence\s*:\s*([0-9.]+)/i.exec(raw);
	if (!match) return { condition: "", confidence: 0 };
	return { condition: match[1].trim(), confidence: Number(match[2]) };
}

function normalizeImageUrl(url = "") {
	const rawUrl = String(url).trim();
	if (!rawUrl) return "";
	if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
	const baseUrl = String(import.meta.env.VITE_API_BASE_URL || "https://api.skinnerai.site").replace(/\/$/, "");
	try {
		return new URL(rawUrl, baseUrl).toString();
	} catch {
		return rawUrl;
	}
}
export function getConfidenceLabel(confidence) {
	const conf = Number(confidence);
	if (isNaN(conf) || conf == null) return "Low";
	if (conf >= 85) return "High";
	if (conf >= 60) return "Medium";
	return "Low";
}
/**
 * Parse top_k alternatives from various formats returned by the backend.
 * Filters out items with 0% confidence and sorts from highest to lowest.
 */
function parseAlternatives(raw) {
	if (!raw) return [];
	let items = raw;
	if (typeof raw === "string") {
		try { items = JSON.parse(raw); } catch { return []; }
	}
	if (!Array.isArray(items)) return [];

	return items
		.map((t) => {
			if (typeof t === "string") return { label: t, confidence: null };
			const label = t.label || t.name || t.disease || t.predicted_class || null;
			let conf = t.confidence ?? t.score ?? t.probability ?? null;
			if (conf !== null) {
				conf = Number(conf);
				// Normalize: if value is <= 1, treat as fraction → convert to percentage
				if (Number.isFinite(conf) && conf <= 1) conf = Math.round(conf * 100);
				else if (Number.isFinite(conf)) conf = Math.round(conf);
				else conf = null;
			}
			return { label, confidence: conf };
		})
		.filter((a) => a.label && (a.confidence === null || a.confidence > 0))
		.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

export function adaptAnalysis(apiAnalysis = {}) {
	const root = apiAnalysis?.data || apiAnalysis;
	const parsedAnalysis = typeof root.analysis === "string" ? parseAnalysisString(root.analysis) : root.analysis;
	const pred = root.prediction || root.primary_detection || root.result || parsedAnalysis || root.analysis || root;

	const condition = firstValue(root, ["skin_disease_classification"]) || firstValue(pred, ["condition", "disease", "label", "diagnosis", "name", "predicted_class"], null);
	const rawConfidence = Number(firstValue(pred, ["confidence", "confidence_level", "score", "probability"], parsedAnalysis?.confidence ?? null));
	const confidence = Number.isFinite(rawConfidence) ? (rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence)) : null;

	// Parse alternatives from top_k (filter out 0%, sorted high→low)
	// Note: the backend stores top_k as "treatment_suggestion" in the DB
	const rawTopK = pred.top_k || pred.topK || root.top_k || root.topK
		|| root.treatment_suggestion
		|| root.alternatives || root.alternative_detections || pred.alternatives || [];
	const alternatives = parseAlternatives(rawTopK);

	// Look up disease-specific info from our knowledge base
	const diseaseInfo = getDiseaseInfo(condition);

	// Use API-provided description if available, otherwise fall back to our built-in description
	const description = firstValue(pred, ["description", "summary", "details"], null)
		|| (diseaseInfo ? diseaseInfo.description : null);

	// Medical recommendations based on the detected disease (not the alternatives list)
	const recommendations = diseaseInfo ? diseaseInfo.recommendations : [];

	return {
		raw: root,
		id: extractId(root, ["analysis_id"]),
		condition,
		confidenceLevel: confidence != null ? getConfidenceLabel(confidence) : null,
		confidence,
		description,
		recommendations,
		alternatives,
		createdAt: firstValue(root, ["created_at", "createdAt", "date"], null),
		imageUrl: normalizeImageUrl(firstValue(root, ["image_url", "imageUrl", "image", "patient_image", "skin_image_upload"], null)),
	};
}
export function adaptDoctorCase(apiCase = {}, fallback = {}) {
  const root = apiCase?.data || apiCase;
  
  let analysis = root.analysis || root.analysis_data || root.ai_analysis || {};
  if (typeof analysis === "string") {
    try {
      analysis = JSON.parse(analysis);
    } catch {
      const parsed = parseAnalysisString(analysis);
      analysis = {
        condition: parsed.condition,
        confidence: parsed.confidence,
        confidenceLevel: parsed.confidence ? getConfidenceLabel(parsed.confidence) : null,
      };
    }
  }

  const patient = root.patient || root.patient_data || root;
  const id = firstValue(root, ["appointment_id", "id", "_id"], fallback.appointment_id || fallback.id || null);
  
  const confidenceRaw = firstValue(analysis, ["confidence", "confidence_level", "score"], fallback.ai_confidence || null);
  const ai_confidence = confidenceRaw != null
    ? (String(confidenceRaw).includes("%") ? String(confidenceRaw) : `${Math.round(Number(confidenceRaw) <= 1 ? Number(confidenceRaw) * 100 : Number(confidenceRaw))}%`)
    : null;

  return {
    raw: root,
    appointment_id: id,
    id: id || fallback.id || Math.random().toString(36).slice(2),
    submitted_on: firstValue(root, ["submitted_on", "created_at", "date"], fallback.submitted_on || null),
    patient_image: normalizeImageUrl(firstValue(analysis, ["image_url", "image", "patient_image", "skin_image_upload"], firstValue(root, ["skin_image_upload"], fallback.patient_image || null))) || null,
    patient_name: firstValue(patient, ["name", "patient_name"], fallback.patient_name || null),
    patient_age: firstValue(patient, ["age", "patient_age"], fallback.patient_age || null),
    patient_gender: firstValue(patient, ["gender", "patient_gender"], fallback.patient_gender || null),
    ai_diagnosis: firstValue(analysis, ["condition", "diagnosis", "disease", "label", "skin_disease_classification"], firstValue(root, ["skin_disease_classification"], fallback.ai_diagnosis || null)),
    ai_confidence_level: confidenceRaw != null ? getConfidenceLabel(Number(confidenceRaw) <= 1 ? Number(confidenceRaw) * 100 : Number(confidenceRaw)) : null,
    ai_confidence,
    ai_note: fallback.ai_note || null,
    chat_id: firstValue(root, ["chat_id", "chatId"], fallback.chat_id || null),
    status: firstValue(root, ["appointment_status", "status"], fallback.status || null),
    unread_count: firstValue(root, ["unread_count", "unreadCount"], fallback.unread_count || 0),
  };
}
export function adaptMessage(apiMessage = {}, currentRole = "patient") { const senderRole = firstValue(apiMessage, ["sender_role", "role", "sender"], ""); const fileUrl = firstValue(apiMessage, ["chat_file", "file_url", "file", "image_url", "image", "attachment_url", "attachment"], ""); const msgType = firstValue(apiMessage, ["message_type", "type"], ""); return { raw: apiMessage, id: firstValue(apiMessage, ["message_id", "id", "_id"], `${Date.now()}-${Math.random()}`), side: senderRole && senderRole === currentRole ? "right" : "left", text: firstValue(apiMessage, ["message_text", "text", "message", "content"], ""), time: firstValue(apiMessage, ["created_at", "time", "sent_at"], "Now"), fileUrl: fileUrl || "", messageType: msgType || "" }; }
