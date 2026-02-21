"use client";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
// 🛑 Using 'html-to-image' which is more modern than html2canvas
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// Helper component for an individual consent section
const ConsentSection = ({ title, content, initialsImage }) => (
  <div className="consent-section mb-4 p-3 border-b border-gray-200">
    <h4 className="font-semibold text-sm mb-1">{title}</h4>
    <p className="text-xs italic text-gray-700">{content}</p>
    <div className="initials flex items-center justify-end mt-1">
            <span className="text-xs font-medium mr-2">Initials:</span>
      {initialsImage ? (
        <span className="w-16 h-8 border-b border-black text-center text-sm font-bold flex items-center justify-center">
          <img
            src={initialsImage}
            alt="Initial Signature"
            className="h-full object-contain"
          />
        </span>
      ) : (
        <span className="w-16 h-8 border-b border-black text-center text-sm font-bold flex items-center justify-center text-gray-400">
                    _____________
        </span>
      )}
    </div>
  </div>
);

export default function ConsentFormModal({ patient, calculateAge, onClose }) {
  const contentRef = useRef(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 100) {
        toast.error("Image must be smaller than 100KB.");
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result);
        setIsUploading(false);
        toast.success("Signature image uploaded successfully.");
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast.error("Failed to read file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = async () => {
    if (!signatureImage) {
      toast.error(
        "Please upload the patient's signature/initials image before generating the PDF.",
      );
      return;
    }

    setIsGenerating(true);
    toast.loading("Generating PDF...", { id: "pdf-toast" });

    try {
      const element = contentRef.current; // 1. Use html-to-image's toPng() function

      const imgData = await toPng(element, {
        // Ensure background is solid white
        backgroundColor: "#ffffff", // Scale for better resolution
        pixelRatio: 2,
      }); // Create a temporary Image object to get natural width/height from the data URL

      const img = new Image();
      img.src = imgData; // Wait for the image data to load into the object before reading dimensions

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm // Calculate image height to maintain aspect ratio
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0; // 2. Add the content to the PDF (using 'PNG' format)

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight; // 3. Handle multi-page content - Corrected vertical position calculation

      // Define a small, compensating overlap margin (e.g., 2mm)
      const overlapMargin = -1; // Adjust the margin as needed

      // Handle multi-page content with corrected position calculation
      while (heightLeft >= 0) {
        pdf.addPage();
        // Shift the position up by pageHeight AND subtract the overlapMargin
        position = position - pageHeight + overlapMargin;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      } // 4. Save and Download the PDF

      pdf.save(
        `ConsentForm_${patient.patientName}_${new Date()
          .toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/\//g, "_")}.pdf`,
      );

      toast.success("PDF generated successfully!", { id: "pdf-toast" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. See console for details.", {
        id: "pdf-toast",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const age = calculateAge(patient.birthdate);

  return (
    <div className="modal modal-open z-99999">
      <div className="modal-box w-full sm:w-11/12 max-w-4xl rounded-2xl shadow-2xl p-0 max-h-[90vh] flex flex-col relative bg-white">
        {/* Header - No-Print */}
        <div className="bg-red-600 text-white px-6 py-4 sticky top-0 z-10 rounded-t-2xl flex justify-between items-center no-print">
          <h2 className="text-xl font-bold">Informed Consent Form</h2>
          <div className="flex flex-col md:flex-row space-x-2 space-y-2 md:space-y-0">
            <label
              className={`btn btn-sm border-none bg-white text-red-600 hover:bg-gray-100 cursor-pointer ${
                isGenerating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading
                ? "Uploading..."
                : signatureImage
                  ? "Replace Signature"
                  : "Upload Signature"}

              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading || isGenerating}
              />
            </label>

            <button
              onClick={handlePrint}
              disabled={!signatureImage || isGenerating}
              className={`btn btn-sm border-none bg-white text-red-600 hover:bg-gray-100 ${
                !signatureImage || isGenerating
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
                            {isGenerating ? "Saving..." : "Save as PDF"} 💾    
            </button>

            <button
              onClick={onClose}
              className="btn btn-sm border-none bg-red-800 text-white hover:bg-red-900"
            >
              Close
            </button>
          </div>
        </div>
        {/* Content for Print/PDF */} 
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundColor: "white",
            color: "black",
          }}
        >
          {/* Ref is now correctly on the print-area div to capture all content */}

          <div className="print-area" ref={contentRef}>
            <h1 className="consent-title text-2xl font-extrabold text-center mb-6">
              INFORMED CONSENT
            </h1>
            <div className="patient-info text-sm mb-6 border-b pb-4">
              <p className="mb-1">
                **Patient Name:**
                <span className="font-semibold">{patient.patientName}</span>   
              </p>

              <p className="mb-1">
                **Date of Birth:**
                <span className="font-semibold">
                  {new Date(patient.birthdate).toLocaleDateString()}           
                </span>
              </p>

              <p className="mb-1">
                **Age:**
                <span className="font-semibold">{age || "N/A"} years old</span> 
              </p>

              <p className="mb-1">
                **Contact:**
                <span className="font-semibold">
                  {patient.contact || "N/A"}
                </span>
              </p>

              <p>
                **Address:**
                <span className="font-semibold">
                  {patient.address || "N/A"}
                </span>
              </p>
              {signatureImage && (
                <p className="text-xs mt-3 text-green-600">
                  ✅ Signature image uploaded and ready to be placed on all    
                  initial spots.
                </p>
              )}
            </div>
                        {/* Consent Sections - UPDATED CONTENT */}
            <div className="space-y-4">
              <ConsentSection
                title="DRUGS & MEDICATIONS"
                content="I understand that antibiotics, analgesics & other medications can cause allergic like redness & swelling of tissue, pain, itch, vomiting &/or anaphylactic shock."
                initialsImage={signatureImage}
              />

              <ConsentSection
                title="CHANGES IN TREATMENT PLAN"
                content="I understand that during treatment it may be necessary to change/add procedure because of conditions found while working on the teeth that were not discovered during examination. For example, root canal treatment therapy may be needed following routine restorative procedures. I give my permission to the dentist to make any/all changes and additions as necessary w/ my responsibility to pay all the cost agreed."
                initialsImage={signatureImage}
              />

              <ConsentSection
                title="RADIOGRAPH"
                content="I understand that an x-ray shot may be necessary as part of diagnosis aid to come up with tentative diagnosis of my dental problem and to make a good treatment plan. But this will not give me 100% assurance for accuracy of the treatment since all dental treatments are subject to unpredictable complications that later in may lead to sudden change in treatment plan and subject to new charges."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="EXTRACTION OF TEETH"
                content="I understand that alternative to tooth removal (root canal) & I completely understand this alternative including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed such as pain, swelling, spread of infection, dry socket, fractured jew, loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="CROWNS & BRIDGES"
                content="Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. I understand there will be additional charges for remakes due to my delaying of permanent cementation, & I realized that final opportunity to make changes in my new crown, bridges, or cap (including shape, fit, size, & color) will be before permanent cementation."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="ENDODONTICS (ROOT CANAL)"
                content="I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally root canal filling materials may extend through the tooth which does not necessarily affect the success of the treatment. I understand that endodontic files & drills are very fine Instruments & stresses vented in their manufacture & calcifications present in teeth can cause them to break during use. I understand that referral to endodontist for additional treatments may be necessary following any              
                 root canal treatment & I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal despite all efforts to save it."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="PERIODONTAL DISEASE"
                content="I understand that periodontal disease is a serious condition causing gum & bone inflammation &/or loss & that can lead to the loss of my teeth. I understand that alternative treatment plans to correct periodontal disease, including gum surgery tooth extractions with or without replacement. I understand that undertaking any dental procedures may have future adverse effect on my periodontal conditions."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="FILLINGS"
                content="I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required, as additional decay or fracture may become evident after initial excavation. I understand that significant sensitivity is a common, but usually temporary after-effect of a newly placed filling. I further understand that filling a tooth may irritate the nerve tissue creating sensitivity & treating such sensitivity could require root canal therapy or extractions."
                initialsImage={signatureImage}
              />
              <ConsentSection
                title="DENTURES"
                content="I understand that wearing dentures can be difficult. Sore spots, altered speech & difficulty in eating are common problems. Immediate dentures (placement of denture immediately after extractions) may be painful, Immediate dentures may require considerable adjusting & s"
                initialsImage={signatureImage}
              />
            </div>
                        {/* Final Signature Section */}
            <div className="consent-footer mt-10 p-4 border border-gray-300 rounded-lg">
              <p className="text-sm font-bold mb-3">
                I certify that I have read and understood the conditions of this
                Informed Consent Form, and all my questions have been answered
                to my satisfaction. I voluntarily give consent to the proposed
                treatment plan.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                  <span className="text-sm font-medium block">
                    Patient/Guardian E-Signature:          
                  </span>
                  {/* Final Signature Image Display */}       
                  <div className="w-full h-16 border-b border-black mt-1 text-center text-lg font-signature italic flex items-center justify-start p-2">
                    {signatureImage ? (
                      <img
                        src={signatureImage}
                        alt="Final Signature"
                        className="h-full object-contain"
                        style={{
                          border: "none",
                          borderBottom: "1px solid black",
                          backgroundColor: "transparent",
                        }}
                      />
                    ) : (
                      <span className="text-gray-400">
                        Signature area (Please upload file)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Date:</span>           
                  <div className="w-full h-10 border-b border-black mt-1 text-base p-2">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
