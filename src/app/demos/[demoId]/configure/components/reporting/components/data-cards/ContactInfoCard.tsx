import { ContactInfo } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ContactInfoCardProps {
  contact: ContactInfo | null;
}

export function ContactInfoCard({ contact }: ContactInfoCardProps) {
  if (!contact) {
    return (
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          👤 Contact Information
        </h5>
        <p className="text-sm text-gray-500">
          No contact information captured for this conversation
        </p>
      </div>
    );
  }

  const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
        👤 Contact Information
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Captured
        </span>
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-blue-700">Full Name:</span>
            <p className="text-sm text-blue-900 font-medium">
              {fullName || "Not provided"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-blue-700">Email:</span>
            <p className="text-sm text-blue-900">
              {contact.email || "Not provided"}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-blue-700">Position:</span>
            <p className="text-sm text-blue-900">
              {contact.position || "Not provided"}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-blue-700">Captured:</span>
            <p className="text-xs text-blue-600">
              {formatDate(contact.received_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
