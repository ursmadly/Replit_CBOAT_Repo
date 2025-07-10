import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Shield, 
  Key, 
  Lock, 
  Users, 
  AlertOctagon, 
  Server, 
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react";

function SecuritySettings() {
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiration: 90,
    preventReuse: 5
  });

  const [mfaSettings, setMfaSettings] = useState({
    enabled: true,
    requiredForAll: false,
    requiredForAdmins: true,
    allowEmail: true,
    allowAuthenticatorApp: true,
    allowSMS: false,
    rememberDeviceForDays: 30
  });

  const [sessionSettings, setSessionSettings] = useState({
    sessionTimeout: 30,
    maxConcurrentSessions: 2,
    enforceIPLock: false,
    enforceDeviceLock: true,
    logFailedAttempts: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15
  });

  const [dataSettings, setDataSettings] = useState({
    encryptData: true,
    encryptBackups: true,
    dataRetentionPeriod: 730, // days
    anonymizeDeletedData: true,
    enableAuditLogging: true,
    auditLogRetention: 365 // days
  });

  const [networkSettings, setNetworkSettings] = useState({
    allowedIPRanges: ["192.168.0.0/16", "10.0.0.0/8"],
    enableVPN: true,
    blockCountries: ["North Korea", "Russia"],
    useHTTPS: true,
    hsts: true,
    enableFirewall: true
  });

  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    console.log("Saving security settings...");
    setSavedSuccessfully(true);
    setTimeout(() => setSavedSuccessfully(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-3 text-primary" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>
            Configure platform security policies and controls
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="password">
            <Key className="h-4 w-4 mr-2" />
            Password Policy
          </TabsTrigger>
          <TabsTrigger value="mfa">
            <Lock className="h-4 w-4 mr-2" />
            MFA & Access
          </TabsTrigger>
          <TabsTrigger value="session">
            <Users className="h-4 w-4 mr-2" />
            Session Security
          </TabsTrigger>
          <TabsTrigger value="data">
            <Server className="h-4 w-4 mr-2" />
            Data Security
          </TabsTrigger>
          <TabsTrigger value="network">
            <Globe className="h-4 w-4 mr-2" />
            Network Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>
                Configure password requirements and expiration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Password Length</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="minLength"
                        type="number"
                        value={passwordPolicy.minLength}
                        onChange={(e) => setPasswordPolicy({
                          ...passwordPolicy,
                          minLength: parseInt(e.target.value)
                        })}
                        min={8}
                        max={32}
                      />
                      <span className="text-sm text-gray-500">characters</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiration">Password Expiration</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="passwordExpiration"
                        type="number"
                        value={passwordPolicy.passwordExpiration}
                        onChange={(e) => setPasswordPolicy({
                          ...passwordPolicy,
                          passwordExpiration: parseInt(e.target.value)
                        })}
                        min={0}
                        max={365}
                      />
                      <span className="text-sm text-gray-500">days (0 = never)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preventReuse">Prevent Password Reuse</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="preventReuse"
                        type="number"
                        value={passwordPolicy.preventReuse}
                        onChange={(e) => setPasswordPolicy({
                          ...passwordPolicy,
                          preventReuse: parseInt(e.target.value)
                        })}
                        min={0}
                        max={24}
                      />
                      <span className="text-sm text-gray-500">previous passwords</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireUppercase"
                      checked={passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => setPasswordPolicy({
                        ...passwordPolicy,
                        requireUppercase: checked
                      })}
                    />
                    <Label htmlFor="requireUppercase">Require uppercase letters</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireLowercase"
                      checked={passwordPolicy.requireLowercase}
                      onCheckedChange={(checked) => setPasswordPolicy({
                        ...passwordPolicy,
                        requireLowercase: checked
                      })}
                    />
                    <Label htmlFor="requireLowercase">Require lowercase letters</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireNumbers"
                      checked={passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => setPasswordPolicy({
                        ...passwordPolicy,
                        requireNumbers: checked
                      })}
                    />
                    <Label htmlFor="requireNumbers">Require numbers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requireSpecialChars"
                      checked={passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) => setPasswordPolicy({
                        ...passwordPolicy,
                        requireSpecialChars: checked
                      })}
                    />
                    <Label htmlFor="requireSpecialChars">Require special characters</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mfa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Configure MFA requirements and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="mfaEnabled"
                      checked={mfaSettings.enabled}
                      onCheckedChange={(checked) => setMfaSettings({
                        ...mfaSettings,
                        enabled: checked
                      })}
                    />
                    <Label htmlFor="mfaEnabled">Enable MFA</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requiredForAll"
                      checked={mfaSettings.requiredForAll}
                      disabled={!mfaSettings.enabled}
                      onCheckedChange={(checked) => setMfaSettings({
                        ...mfaSettings,
                        requiredForAll: checked
                      })}
                    />
                    <Label htmlFor="requiredForAll" className={!mfaSettings.enabled ? "text-gray-400" : ""}>
                      Required for all users
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requiredForAdmins"
                      checked={mfaSettings.requiredForAdmins}
                      disabled={!mfaSettings.enabled || mfaSettings.requiredForAll}
                      onCheckedChange={(checked) => setMfaSettings({
                        ...mfaSettings,
                        requiredForAdmins: checked
                      })}
                    />
                    <Label 
                      htmlFor="requiredForAdmins" 
                      className={(!mfaSettings.enabled || mfaSettings.requiredForAll) ? "text-gray-400" : ""}
                    >
                      Required for admins only
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">MFA Methods</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="allowAuthenticatorApp"
                        checked={mfaSettings.allowAuthenticatorApp}
                        disabled={!mfaSettings.enabled}
                        onCheckedChange={(checked) => setMfaSettings({
                          ...mfaSettings,
                          allowAuthenticatorApp: checked
                        })}
                      />
                      <Label htmlFor="allowAuthenticatorApp" className={!mfaSettings.enabled ? "text-gray-400" : ""}>
                        Authenticator App (TOTP)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="allowEmail"
                        checked={mfaSettings.allowEmail}
                        disabled={!mfaSettings.enabled}
                        onCheckedChange={(checked) => setMfaSettings({
                          ...mfaSettings,
                          allowEmail: checked
                        })}
                      />
                      <Label htmlFor="allowEmail" className={!mfaSettings.enabled ? "text-gray-400" : ""}>
                        Email OTP
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="allowSMS"
                        checked={mfaSettings.allowSMS}
                        disabled={!mfaSettings.enabled}
                        onCheckedChange={(checked) => setMfaSettings({
                          ...mfaSettings,
                          allowSMS: checked
                        })}
                      />
                      <Label htmlFor="allowSMS" className={!mfaSettings.enabled ? "text-gray-400" : ""}>
                        SMS OTP
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="rememberDeviceForDays">Remember Device For</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="rememberDeviceForDays"
                      type="number"
                      value={mfaSettings.rememberDeviceForDays}
                      onChange={(e) => setMfaSettings({
                        ...mfaSettings,
                        rememberDeviceForDays: parseInt(e.target.value)
                      })}
                      min={0}
                      max={90}
                      disabled={!mfaSettings.enabled}
                    />
                    <span className="text-sm text-gray-500">days (0 = never remember)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session & Login Security</CardTitle>
              <CardDescription>
                Configure session timeouts and login security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={sessionSettings.sessionTimeout}
                        onChange={(e) => setSessionSettings({
                          ...sessionSettings,
                          sessionTimeout: parseInt(e.target.value)
                        })}
                        min={5}
                        max={240}
                      />
                      <span className="text-sm text-gray-500">minutes</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="maxConcurrentSessions"
                        type="number"
                        value={sessionSettings.maxConcurrentSessions}
                        onChange={(e) => setSessionSettings({
                          ...sessionSettings,
                          maxConcurrentSessions: parseInt(e.target.value)
                        })}
                        min={1}
                        max={10}
                      />
                      <span className="text-sm text-gray-500">sessions</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="enforceIPLock"
                      checked={sessionSettings.enforceIPLock}
                      onCheckedChange={(checked) => setSessionSettings({
                        ...sessionSettings,
                        enforceIPLock: checked
                      })}
                    />
                    <Label htmlFor="enforceIPLock">Lock sessions to IP address</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enforceDeviceLock"
                      checked={sessionSettings.enforceDeviceLock}
                      onCheckedChange={(checked) => setSessionSettings({
                        ...sessionSettings,
                        enforceDeviceLock: checked
                      })}
                    />
                    <Label htmlFor="enforceDeviceLock">Lock sessions to device</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Login Attempt Security</h3>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="logFailedAttempts"
                      checked={sessionSettings.logFailedAttempts}
                      onCheckedChange={(checked) => setSessionSettings({
                        ...sessionSettings,
                        logFailedAttempts: checked
                      })}
                    />
                    <Label htmlFor="logFailedAttempts">Log failed login attempts</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxFailedAttempts">Max Failed Attempts Before Lockout</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="maxFailedAttempts"
                        type="number"
                        value={sessionSettings.maxFailedAttempts}
                        onChange={(e) => setSessionSettings({
                          ...sessionSettings,
                          maxFailedAttempts: parseInt(e.target.value)
                        })}
                        min={1}
                        max={10}
                      />
                      <span className="text-sm text-gray-500">attempts</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Account Lockout Duration</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="lockoutDuration"
                        type="number"
                        value={sessionSettings.lockoutDuration}
                        onChange={(e) => setSessionSettings({
                          ...sessionSettings,
                          lockoutDuration: parseInt(e.target.value)
                        })}
                        min={5}
                        max={1440}
                      />
                      <span className="text-sm text-gray-500">minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Security & Privacy</CardTitle>
              <CardDescription>
                Configure data encryption, retention, and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="encryptData"
                      checked={dataSettings.encryptData}
                      onCheckedChange={(checked) => setDataSettings({
                        ...dataSettings,
                        encryptData: checked
                      })}
                    />
                    <Label htmlFor="encryptData">Encrypt sensitive data at rest</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="encryptBackups"
                      checked={dataSettings.encryptBackups}
                      onCheckedChange={(checked) => setDataSettings({
                        ...dataSettings,
                        encryptBackups: checked
                      })}
                    />
                    <Label htmlFor="encryptBackups">Encrypt database backups</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="anonymizeDeletedData"
                      checked={dataSettings.anonymizeDeletedData}
                      onCheckedChange={(checked) => setDataSettings({
                        ...dataSettings,
                        anonymizeDeletedData: checked
                      })}
                    />
                    <Label htmlFor="anonymizeDeletedData">Anonymize deleted personal data</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enableAuditLogging"
                      checked={dataSettings.enableAuditLogging}
                      onCheckedChange={(checked) => setDataSettings({
                        ...dataSettings,
                        enableAuditLogging: checked
                      })}
                    />
                    <Label htmlFor="enableAuditLogging">Enable comprehensive audit logging</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionPeriod">Data Retention Period</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="dataRetentionPeriod"
                        type="number"
                        value={dataSettings.dataRetentionPeriod}
                        onChange={(e) => setDataSettings({
                          ...dataSettings,
                          dataRetentionPeriod: parseInt(e.target.value)
                        })}
                        min={30}
                        max={3650}
                      />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditLogRetention">Audit Log Retention</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="auditLogRetention"
                        type="number"
                        value={dataSettings.auditLogRetention}
                        onChange={(e) => setDataSettings({
                          ...dataSettings,
                          auditLogRetention: parseInt(e.target.value)
                        })}
                        min={30}
                        max={3650}
                        disabled={!dataSettings.enableAuditLogging}
                      />
                      <span className="text-sm text-gray-500">days</span>
                    </div>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="encryption-key-management">
                  <AccordionTrigger>Encryption Key Management</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 space-y-4">
                      <p className="text-sm text-gray-600">
                        Encryption keys are stored securely and rotated automatically every 90 days.
                      </p>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-2" />
                          View Key Status
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Rotate Keys
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network & Access Controls</CardTitle>
              <CardDescription>
                Configure network security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="allowedIPRanges">Allowed IP Ranges</Label>
                    <div>
                      {networkSettings.allowedIPRanges.map((range, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <Input
                            value={range}
                            onChange={(e) => {
                              const newRanges = [...networkSettings.allowedIPRanges];
                              newRanges[index] = e.target.value;
                              setNetworkSettings({
                                ...networkSettings,
                                allowedIPRanges: newRanges
                              });
                            }}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="ml-2"
                            onClick={() => {
                              const newRanges = [...networkSettings.allowedIPRanges];
                              newRanges.splice(index, 1);
                              setNetworkSettings({
                                ...networkSettings,
                                allowedIPRanges: newRanges
                              });
                            }}
                          >
                            <AlertOctagon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNetworkSettings({
                            ...networkSettings,
                            allowedIPRanges: [...networkSettings.allowedIPRanges, ""]
                          });
                        }}
                      >
                        Add IP Range
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="blockedCountries">Blocked Countries</Label>
                    <div>
                      {networkSettings.blockCountries.map((country, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <Input
                            value={country}
                            onChange={(e) => {
                              const newCountries = [...networkSettings.blockCountries];
                              newCountries[index] = e.target.value;
                              setNetworkSettings({
                                ...networkSettings,
                                blockCountries: newCountries
                              });
                            }}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="ml-2"
                            onClick={() => {
                              const newCountries = [...networkSettings.blockCountries];
                              newCountries.splice(index, 1);
                              setNetworkSettings({
                                ...networkSettings,
                                blockCountries: newCountries
                              });
                            }}
                          >
                            <AlertOctagon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNetworkSettings({
                            ...networkSettings,
                            blockCountries: [...networkSettings.blockCountries, ""]
                          });
                        }}
                      >
                        Add Country
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enableVPN"
                      checked={networkSettings.enableVPN}
                      onCheckedChange={(checked) => setNetworkSettings({
                        ...networkSettings,
                        enableVPN: checked
                      })}
                    />
                    <Label htmlFor="enableVPN">Require VPN for external access</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="useHTTPS"
                      checked={networkSettings.useHTTPS}
                      onCheckedChange={(checked) => setNetworkSettings({
                        ...networkSettings,
                        useHTTPS: checked
                      })}
                    />
                    <Label htmlFor="useHTTPS">Enforce HTTPS connections only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="hsts"
                      checked={networkSettings.hsts}
                      disabled={!networkSettings.useHTTPS}
                      onCheckedChange={(checked) => setNetworkSettings({
                        ...networkSettings,
                        hsts: checked
                      })}
                    />
                    <Label 
                      htmlFor="hsts"
                      className={!networkSettings.useHTTPS ? "text-gray-400" : ""}
                    >
                      Enable HTTP Strict Transport Security (HSTS)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enableFirewall"
                      checked={networkSettings.enableFirewall}
                      onCheckedChange={(checked) => setNetworkSettings({
                        ...networkSettings,
                        enableFirewall: checked
                      })}
                    />
                    <Label htmlFor="enableFirewall">Enable application firewall</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveSettings}>
          {savedSuccessfully ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved Successfully
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}

export default SecuritySettings;