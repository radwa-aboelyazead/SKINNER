"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Info, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PasswordInput from "../ui/PasswordInput";
import { useFileUpload } from "@/hooks/use-file-upload";
import { authApi } from "@/services/skinnerApi";
import { cleanText, digitsOnly, isValidEmail, isValidPhone, sanitizeText, getBirthDateFromNationalId, calculateAge } from "@/lib/formValidation";

const defaults = {
  patient: { name: "", email: "", phone: "", age: "", gender: "", address: "", password: "", confirmPassword: "" },
  doctor: { name: "", email: "", phone: "", gender: "", national_id: "", age: "", year_of_experience: "", specialization: "Dermatology", clinic_address: "", consultation_fee: "", password: "", confirmPassword: "" },
  admin: { email: "", invite_code: "", password: "", confirmPassword: "" },
};

function FieldError({ message }) { return message ? <p className="mt-1 text-[10px] font-medium text-red-600">{message}</p> : null; }
function InfoBox({ children, tone = "blue" }) { return <div className={`flex items-start gap-2 rounded-md border p-3 text-[11px] ${tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}><Info className="mt-0.5 h-4 w-4 shrink-0"/><div>{children}</div></div>; }

export default function RegisterCard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [forms, setForms] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [{ files, isDragging, errors: fileErrors }, uploadActions] = useFileUpload({ accept: "image/png,image/jpeg,image/jpg,application/pdf", maxSize: 10 * 1024 * 1024 });
  const { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, getInputProps } = uploadActions;
  const selectedFile = files[0]?.file instanceof File ? files[0].file : null;
  const current = forms[role];

  const update = (targetRole, field) => (eventOrValue) => {
    const raw = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    let value = raw;
    if (["name", "address", "clinic_address", "specialization"].includes(field)) value = sanitizeText(raw, 160);
    if (field === "email") value = cleanText(raw, 120).toLowerCase();
    if (["age", "year_of_experience"].includes(field)) value = digitsOnly(raw).slice(0, 3);
    if (field === "consultation_fee") value = String(raw).replace(/[^0-9.]/g, "").slice(0, 8);
    setForms((prev) => ({ ...prev, [targetRole]: { ...prev[targetRole], [field]: value } }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  };

  const validate = () => {
    const form = forms[role];
    const next = {};
    if (role !== "admin") {
      if (cleanText(form.name, 80).length < 2) next.name = "Name is required.";
      if (form.phone && !isValidPhone(form.phone)) next.phone = "Enter a valid Egyptian mobile phone.";
      if (!form.gender) next.gender = "Select gender.";
    }
    if (!isValidEmail(form.email)) next.email = "Enter a valid email.";
    if (!form.password || form.password.length < 6) next.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";
    
    if (role === "patient") {
      const patientAge = Number(form.age);
      if (form.age === "" || isNaN(patientAge) || patientAge < 13 || patientAge > 100 || !Number.isInteger(patientAge)) {
        next.age = "Age must be an integer between 13 and 100.";
      }
      if (cleanText(form.address, 160).length < 2) next.address = "Address is required.";
    }
    
    if (role === "doctor") {
      const nationalId = String(form.national_id).trim();
      const experience = Number(form.year_of_experience);
      const fee = Number(form.consultation_fee);
      const docAge = Number(form.age);

      // Entered Age Validation (23 to 75)
      if (form.age === "" || isNaN(docAge) || docAge < 23 || docAge > 75 || !Number.isInteger(docAge)) {
        next.age = "Age must be an integer between 23 and 75.";
      }

      // National ID Validation (14 digits, digits only, starting with 2 or 3)
      if (!/^[23][0-9]{13}$/.test(nationalId)) {
        next.national_id = "National ID must be exactly 14 digits and start with 2 or 3.";
      } else {
        const birthDate = getBirthDateFromNationalId(nationalId);
        if (!birthDate) {
          next.national_id = "National ID contains an invalid date of birth.";
        } else {
          const calculatedAge = calculateAge(birthDate);
          if (calculatedAge < 23) {
            next.national_id = "Doctor must be at least 23 years old based on National ID.";
          } else if (!isNaN(docAge) && docAge !== calculatedAge) {
            next.national_id = `National ID age (${calculatedAge}) does not match entered age (${docAge}).`;
          }
        }
      }

      // Experience Years Validation (0 to 45 years)
      if (form.year_of_experience === "" || isNaN(experience) || experience < 0 || experience > 45 || !Number.isInteger(experience)) {
        next.year_of_experience = "Experience must be an integer between 0 and 45 years.";
      } else if (!isNaN(docAge) && experience > docAge - 23) {
        next.year_of_experience = `Experience cannot exceed ${docAge - 23} years relative to age (${docAge}).`;
      }

      // Consultation Fee Validation (50 to 3000 EGP)
      if (form.consultation_fee === "" || isNaN(fee) || fee < 50 || fee > 3000 || !Number.isInteger(fee)) {
        next.consultation_fee = "Consultation fee must be an integer between 50 and 3000 EGP.";
      }

      if (cleanText(form.clinic_address, 160).length < 2) next.clinic_address = "Clinic address is required.";
      if (!selectedFile) next.syndicate_card_image = "Upload doctor ID.";
    }
    if (role === "admin" && cleanText(form.invite_code, 80).length < 4) next.invite_code = "Invite code is required.";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setIsSubmitting(true);
    setServerError("");
    setServerMessage("");
    try {
      if (role === "patient") await authApi.registerPatient({ name: cleanText(current.name, 80), email: current.email, phone: cleanText(current.phone, 24), gender: current.gender, password: current.password, age: Number(current.age), address: cleanText(current.address, 160) });
      if (role === "doctor") await authApi.registerDoctor({ name: cleanText(current.name, 80), email: current.email, phone: cleanText(current.phone, 24), gender: current.gender, national_id: cleanText(current.national_id, 24), age: Number(current.age), password: current.password, year_of_experience: Number(current.year_of_experience), specialization: current.specialization, clinic_address: cleanText(current.clinic_address, 160), consultation_fee: Number(current.consultation_fee) }, selectedFile);
      if (role === "admin") await authApi.registerAdmin({ email: current.email, password: current.password, invite_code: cleanText(current.invite_code, 80) });
      setServerMessage("Registration submitted successfully.");
      setTimeout(() => navigate("/sign-in"), 900);
    } catch (error) { setServerError(error.message || "Registration failed. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  return <Card className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm"><CardContent><h2 className="text-[16px] font-semibold text-gray-900">Create an Account</h2><p className="mt-1 text-[12px] text-gray-500">Register as a patient, healthcare provider, or admin</p><Tabs value={role} className="mt-5" onValueChange={(v)=>{setRole(v);setErrors({});setServerError("");setServerMessage("");}}><TabsList className="grid h-10 w-full grid-cols-3 bg-[#ECECF0] p-1"><TabsTrigger value="patient" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Patient</TabsTrigger><TabsTrigger value="doctor" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Doctor</TabsTrigger><TabsTrigger value="admin" className="text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin</TabsTrigger></TabsList><form onSubmit={submit} className="mt-5 space-y-4"><TabsContent value="patient" className="space-y-4"><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Full Name</Label><Input value={current.name} onChange={update("patient","name")} className="h-9 text-[12px]" placeholder="John Doe"/><FieldError message={errors.name}/></label><label><Label className="text-[12px]">Email</Label><Input value={current.email} onChange={update("patient","email")} className="h-9 text-[12px]" placeholder="name@example.com"/><FieldError message={errors.email}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Phone</Label><Input value={current.phone} onChange={update("patient","phone")} className="h-9 text-[12px]" placeholder="01000000000"/><FieldError message={errors.phone}/></label><label><Label className="text-[12px]">Age</Label><Input value={current.age} onChange={update("patient","age")} className="h-9 text-[12px]" placeholder="25"/><FieldError message={errors.age}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Gender</Label><Select value={current.gender} onValueChange={update("patient","gender")}><SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Gender"/></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FieldError message={errors.gender}/></label><label><Label className="text-[12px]">Address</Label><Input value={current.address} onChange={update("patient","address")} className="h-9 text-[12px]" placeholder="Alexandria"/><FieldError message={errors.address}/></label></div><InfoBox>By registering, you agree to our Terms of Service and Privacy Policy.</InfoBox></TabsContent><TabsContent value="doctor" className="space-y-4"><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Full Name</Label><Input value={current.name} onChange={update("doctor","name")} className="h-9 text-[12px]" placeholder="Dr. Jane Smith"/><FieldError message={errors.name}/></label><label><Label className="text-[12px]">Email</Label><Input value={current.email} onChange={update("doctor","email")} className="h-9 text-[12px]" placeholder="doctor@hospital.com"/><FieldError message={errors.email}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Phone</Label><Input value={current.phone} onChange={update("doctor","phone")} className="h-9 text-[12px]" placeholder="01012345678"/><FieldError message={errors.phone}/></label><label><Label className="text-[12px]">Gender</Label><Select value={current.gender} onValueChange={update("doctor","gender")}><SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Gender"/></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FieldError message={errors.gender}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">National ID</Label><Input value={current.national_id} onChange={update("doctor","national_id")} className="h-9 text-[12px]" placeholder="29801011234567"/><FieldError message={errors.national_id}/></label><label><Label className="text-[12px]">Age</Label><Input value={current.age} onChange={update("doctor","age")} className="h-9 text-[12px]" placeholder="35"/><FieldError message={errors.age}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Experience</Label><Input value={current.year_of_experience} onChange={update("doctor","year_of_experience")} className="h-9 text-[12px]" placeholder="7"/><FieldError message={errors.year_of_experience}/></label><label><Label className="text-[12px]">Fee</Label><Input value={current.consultation_fee} onChange={update("doctor","consultation_fee")} className="h-9 text-[12px]" placeholder="150"/><FieldError message={errors.consultation_fee}/></label></div><div className="grid grid-cols-2 gap-3"><label><Label className="text-[12px]">Specialization</Label><Select value={current.specialization} onValueChange={update("doctor","specialization")}><SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="Specialization"/></SelectTrigger><SelectContent><SelectItem value="Dermatology">Dermatology</SelectItem><SelectItem value="Pediatric Dermatology">Pediatric Dermatology</SelectItem><SelectItem value="Cosmetic Surgery">Cosmetic Surgery</SelectItem></SelectContent></Select></label><label><Label className="text-[12px]">Clinic Address</Label><Input value={current.clinic_address} onChange={update("doctor","clinic_address")} className="h-9 text-[12px]" placeholder="15 Nile St, Cairo"/><FieldError message={errors.clinic_address}/></label></div><div><Label className="text-[12px]">Upload Syndicate Card</Label><Dialog><DialogTrigger asChild><button type="button" className="relative h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-left text-[12px] text-gray-500"><span>{selectedFile?selectedFile.name:"Upload your ID"}</span><Download className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"/></button></DialogTrigger><DialogContent className="sm:max-w-lg"><div className="flex flex-col gap-5"><div className="text-center"><h2 className="text-xl font-bold text-[#193CB8]">Upload Doctor ID</h2><p className="text-xs text-gray-500">Supported formats: JPG, PNG, PDF</p></div><div className="relative flex min-h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-blue-50/40 p-6 text-center transition hover:border-[#193CB8]" data-dragging={isDragging||undefined} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}><input {...getInputProps()} className="sr-only"/><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"><Upload className="h-5 w-5 text-[#193CB8]"/></div><p className="text-sm font-medium text-[#193CB8]">Drag files here or click to upload</p><button type="button" onClick={openFileDialog} className="mt-4 rounded-md border border-[#193CB8] px-4 py-1.5 text-xs text-[#193CB8] hover:bg-[#193CB8] hover:text-white">Select File</button></div>{files[0]?.preview&&selectedFile?.type?.startsWith("image/")&&<div className="relative w-fit"><img src={files[0].preview} alt="preview" className="h-28 w-44 rounded-md object-cover shadow-md"/><button type="button" onClick={()=>removeFile(files[0].id)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100"><X className="h-3 w-3 text-gray-600"/></button></div>}{(fileErrors?.length>0||errors.syndicate_card_image)&&<p className="text-center text-xs text-red-500">{fileErrors[0]||errors.syndicate_card_image}</p>}</div></DialogContent></Dialog><FieldError message={errors.syndicate_card_image}/></div><InfoBox>Your registration will be reviewed by our admin team.</InfoBox></TabsContent><TabsContent value="admin" className="space-y-4"><InfoBox tone="amber"><b>Administrator Registration:</b><br/>Admin accounts require authorization and invite code.</InfoBox><label className="block"><Label className="text-[12px]">Email</Label><Input value={current.email} onChange={update("admin","email")} className="h-9 text-[12px]" placeholder="admin@test.com"/><FieldError message={errors.email}/></label><label className="block"><Label className="text-[12px]">Invite Code</Label><Input value={current.invite_code} onChange={update("admin","invite_code")} className="h-9 text-[12px]" placeholder="ADM-82HF-9S1K"/><FieldError message={errors.invite_code}/></label></TabsContent><div className="space-y-1.5"><Label className="text-[12px]">Password</Label><PasswordInput value={current.password} onChange={update(role,"password")} className="text-xs"/><FieldError message={errors.password}/></div><div className="space-y-1.5"><Label className="text-[12px]">Confirm Password</Label><PasswordInput value={current.confirmPassword} onChange={update(role,"confirmPassword")} className="text-xs"/><FieldError message={errors.confirmPassword}/></div>{serverError&&<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">{serverError}</div>}{serverMessage&&<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">{serverMessage}</div>}<Button type="submit" disabled={isSubmitting} className="h-10 w-full bg-[#0B0B1F] text-[12px] hover:bg-[#16162b] disabled:opacity-60">{isSubmitting?"Submitting...":`Register as ${role.charAt(0).toUpperCase()+role.slice(1)}`}</Button></form></Tabs><div className="mt-4 text-center text-[11px] text-gray-500">Already have an account? <Link to="/sign-in" className="text-blue-600 hover:underline">Sign in here</Link></div></CardContent></Card>;
}
