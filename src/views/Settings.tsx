import { useState, useEffect } from "react";
import { Copy, RefreshCw, CheckCircle2, Send, Key, Webhook, Bell, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchSettings, regenerateApiKey, saveWebhookUrl, testWebhook } from "@/lib/api";

export function Settings() {
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    emailOnVerified: true,
    emailOnFlagged: true,
    emailOnPending: false,
    smsOnFlagged: true,
    webhookOnAll: false,
    weeklyDigest: true,
  });

  useEffect(() => {
    fetchSettings()
      .then(data => {
        setApiKey(data.apiKey || "");
        setWebhookUrl(data.webhookUrl || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function copyKey() {
    navigator.clipboard.writeText(apiKey).catch(() => {});
    toast({ title: "Copied!", description: "API key copied to clipboard." });
  }

  async function regenerateKey() {
    setRegenerating(true);
    try {
      const newKey = await regenerateApiKey();
      setApiKey(newKey);
      toast({ title: "Key regenerated", description: "Your old API key has been revoked." });
    } catch {
      toast({ title: "Error", description: "Failed to regenerate API key." });
    }
    setRegenerating(false);
  }

  async function testWebhookFn() {
    setTestingWebhook(true);
    try {
      const result = await testWebhook(apiKey, webhookUrl);
      toast({
        title: result.success ? "Webhook test sent!" : "Webhook test failed",
        description: result.message
      });
    } catch {
      toast({ title: "Error", description: "Failed to send test webhook." });
    }
    setTestingWebhook(false);
  }

  const maskedKey = apiKey.slice(0, 12) + "\u2022".repeat(20) + apiKey.slice(-4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your API credentials, webhooks, and preferences</p>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="px-6 py-4 border-b border-card-border flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">API Key</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Use this key to authenticate API requests from your server.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={showKey ? apiKey : maskedKey}
                  readOnly
                  className="font-mono text-sm pr-10 bg-muted/30"
                  data-testid="input-api-key"
                />
                <button
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="btn-toggle-key-visibility"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={copyKey} className="gap-2 shrink-0" data-testid="btn-copy-key">
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Regenerate Key</p>
              <p className="text-xs text-muted-foreground mt-0.5">This will immediately revoke the existing key</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateKey}
              disabled={regenerating}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
              data-testid="btn-regenerate-key"
            >
              {regenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="px-6 py-4 border-b border-card-border flex items-center gap-2">
          <Webhook className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Webhook</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">We will POST verification results to this URL.</p>
            <div className="flex items-center gap-2">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onBlur={() => { if (webhookUrl) saveWebhookUrl(webhookUrl).catch(console.error); }}
                placeholder="https://yourdomain.com/webhook"
                className="flex-1 font-mono text-sm"
                data-testid="input-webhook-url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testWebhookFn}
                disabled={testingWebhook || !webhookUrl}
                className="gap-2 shrink-0"
                data-testid="btn-test-webhook"
              >
                {testingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Test
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border font-mono">
            <p className="text-foreground font-medium mb-1">Payload format:</p>
            {`{ "id": "VRF-001", "status": "verified", "riskScore": 18, "timestamp": "..." }`}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="px-6 py-4 border-b border-card-border flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Notification Preferences</h2>
        </div>
        <div className="p-6 space-y-4" data-testid="notification-settings">
          {[
            { key: "emailOnVerified", label: "Email when verification passes", desc: "Get notified when a candidate is verified" },
            { key: "emailOnFlagged", label: "Email when verification is flagged", desc: "Get notified for high-risk candidates" },
            { key: "emailOnPending", label: "Email on long-pending verifications", desc: "Alert if verification takes more than 24h" },
            { key: "smsOnFlagged", label: "SMS on flagged verifications", desc: "Immediate SMS alert for high-risk results" },
            { key: "webhookOnAll", label: "Webhook for all events", desc: "POST to your webhook URL on every status change" },
            { key: "weeklyDigest", label: "Weekly digest email", desc: "Summary report every Monday morning" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 ${notifications[key as keyof typeof notifications] ? "bg-primary" : "bg-muted"}`}
                data-testid={`toggle-${key}`}
                style={{ height: "22px" }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${notifications[key as keyof typeof notifications] ? "translate-x-[18px]" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-foreground">Save Changes</p>
            <p className="text-xs text-muted-foreground mt-0.5">All settings are saved automatically</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All saved
          </div>
        </div>
      </div>
    </div>
  );
}
