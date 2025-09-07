// src/components/PrivacyConsent.tsx
import { useState } from "react";
import { sessionManager } from "@/utils/sessionManager";

interface Props {
  onConsentGiven: () => void;
}

export default function PrivacyConsent({ onConsentGiven }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const handleAccept = () => {
    sessionManager.setPrivacyConsent(true);
    onConsentGiven();
  };

  const handleDecline = () => {
    sessionManager.setPrivacyConsent(false);
    // Continue with app but no storage
    onConsentGiven();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Data Storage & Privacy Notice
        </h2>
        
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            Mental Armor™ can optionally store your chat conversations and practice sessions 
            locally in your browser to improve your experience.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What we store:</h3>
            <ul className="list-disc ml-5 space-y-1 text-blue-800">
              <li>Chat conversations with AI coaches</li>
              <li>Practice session progress</li>
              <li>Selected coach preferences</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Your privacy is protected:</h3>
            <ul className="list-disc ml-5 space-y-1 text-green-800">
              <li>All data stays on YOUR device only</li>
              <li>No personal information is collected</li>
              <li>No data is sent to external servers</li>
              <li>Data automatically expires after 7 days</li>
              <li>You can delete all data anytime</li>
            </ul>
          </div>

          {showDetails && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Technical Details:</h3>
              <ul className="list-disc ml-5 space-y-1 text-gray-700 text-xs">
                <li>Data is stored using browser localStorage API</li>
                <li>No cookies or tracking technologies are used</li>
                <li>Sessions expire automatically after 7 days of inactivity</li>
                <li>Data is only accessible by this application on this device</li>
                <li>You can export or print your data at any time</li>
                <li>Declining consent means features work but don't save progress</li>
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-brand-primary hover:underline text-sm"
          >
            {showDetails ? "Hide" : "Show"} technical details
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-xs">
              <strong>GDPR Compliance:</strong> This application processes data locally on your device only. 
              No personal data is transmitted to external servers. You have full control over your data 
              and can request deletion at any time through the app settings.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-brand-primary text-white px-4 py-3 rounded-lg hover:opacity-90 font-medium"
          >
            Accept - Enable Storage
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium"
          >
            Continue Without Storage
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          You can change this preference anytime in the app settings.
        </p>
      </div>
    </div>
  );
}