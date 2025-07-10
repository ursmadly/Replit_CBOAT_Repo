import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Shield, ClipboardCheck, Eye, EyeOff, FileKey, Lock, Server, Database, FolderKey } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface CredentialsManagerProps {
  integrationId: number;
  integrationType: "API" | "SFTP" | "S3";
  onClose: () => void;
}

export default function CredentialsManager({
  integrationId,
  integrationType,
  onClose,
}: CredentialsManagerProps) {
  const [activeTab, setActiveTab] = useState(integrationType === "API" ? "auth" : "connection");
  const [showSecrets, setShowSecrets] = useState(false);
  
  // API credentials
  const [apiCredentials, setApiCredentials] = useState({
    authType: "oauth2",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    username: "",
    password: "",
    clientId: "client_12345",
    clientSecret: "sec_67890abcdef",
    oauthUrl: "https://auth.vendor.com/oauth/token",
    tokenType: "Bearer",
    savedSecurely: false
  });
  
  // SFTP credentials
  const [sftpCredentials, setSftpCredentials] = useState({
    host: "sftp.vendor.com",
    port: "22",
    username: "trial_data_user",
    password: "",
    privateKey: "",
    usePrivateKey: false,
    remotePath: "/incoming/trial-data/",
    savedSecurely: false
  });
  
  // S3 credentials
  const [s3Credentials, setS3Credentials] = useState({
    region: "us-east-1",
    bucketName: "clinical-trial-data",
    accessKeyId: "",
    secretAccessKey: "",
    prefix: "trial-123/",
    useAssumeRole: false,
    roleArn: "",
    savedSecurely: false
  });
  
  const handleTestConnection = () => {
    // In a real app, this would test the connection using the provided credentials
    setTimeout(() => {
      alert("Connection successful!");
    }, 1500);
  };
  
  const renderAuthForm = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="auth-type" className="text-right">
              Authentication Type
            </Label>
            <Select
              value={apiCredentials.authType}
              onValueChange={(value) => setApiCredentials({...apiCredentials, authType: value})}
            >
              <SelectTrigger id="auth-type" className="col-span-3">
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {apiCredentials.authType === "oauth2" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-id" className="text-right">
                  Client ID
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="client-id"
                    type={showSecrets ? "text" : "password"}
                    value={apiCredentials.clientId}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientId: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-secret" className="text-right">
                  Client Secret
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="client-secret"
                    type={showSecrets ? "text" : "password"}
                    value={apiCredentials.clientSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientSecret: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="oauth-url" className="text-right">
                  OAuth URL
                </Label>
                <Input
                  id="oauth-url"
                  value={apiCredentials.oauthUrl}
                  onChange={(e) => setApiCredentials({...apiCredentials, oauthUrl: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </>
          )}
          
          {apiCredentials.authType === "api_key" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api-key" className="text-right">
                  API Key
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="api-key"
                    type={showSecrets ? "text" : "password"}
                    value={apiCredentials.apiKey}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiKey: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api-secret" className="text-right">
                  API Secret
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="api-secret"
                    type={showSecrets ? "text" : "password"}
                    value={apiCredentials.apiSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiSecret: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}
          
          {apiCredentials.authType === "basic" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={apiCredentials.username}
                  onChange={(e) => setApiCredentials({...apiCredentials, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="password"
                    type={showSecrets ? "text" : "password"}
                    value={apiCredentials.password}
                    onChange={(e) => setApiCredentials({...apiCredentials, password: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-secrets"
              checked={showSecrets}
              onCheckedChange={setShowSecrets}
            />
            <Label htmlFor="show-secrets" className="text-sm">Show secret values</Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection}>
              Test Connection
            </Button>
            <Button>
              Save Credentials
            </Button>
          </div>
        </div>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Credentials are securely stored and encrypted. They will be used only for this integration.
          </AlertDescription>
        </Alert>
      </div>
    );
  };
  
  const renderSFTPForm = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="host" className="text-right">
              SFTP Host
            </Label>
            <Input
              id="host"
              value={sftpCredentials.host}
              onChange={(e) => setSftpCredentials({...sftpCredentials, host: e.target.value})}
              className="col-span-3"
              placeholder="sftp.example.com"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">
              Port
            </Label>
            <Input
              id="port"
              value={sftpCredentials.port}
              onChange={(e) => setSftpCredentials({...sftpCredentials, port: e.target.value})}
              className="col-span-3"
              placeholder="22"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sftp-username" className="text-right">
              Username
            </Label>
            <Input
              id="sftp-username"
              value={sftpCredentials.username}
              onChange={(e) => setSftpCredentials({...sftpCredentials, username: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="auth-method" className="text-right">
              Authentication Method
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="use-private-key"
                checked={sftpCredentials.usePrivateKey}
                onCheckedChange={(checked) => 
                  setSftpCredentials({...sftpCredentials, usePrivateKey: checked})
                }
              />
              <Label htmlFor="use-private-key">Use SSH Key</Label>
            </div>
          </div>
          
          {!sftpCredentials.usePrivateKey ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sftp-password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 flex">
                <Input
                  id="sftp-password"
                  type={showSecrets ? "text" : "password"}
                  value={sftpCredentials.password}
                  onChange={(e) => setSftpCredentials({...sftpCredentials, password: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="private-key" className="text-right pt-2">
                Private Key
              </Label>
              <Textarea
                id="private-key"
                value={sftpCredentials.privateKey}
                onChange={(e) => setSftpCredentials({...sftpCredentials, privateKey: e.target.value})}
                className="col-span-3 font-mono text-xs"
                rows={6}
                placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
              />
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="remote-path" className="text-right">
              Remote Path
            </Label>
            <Input
              id="remote-path"
              value={sftpCredentials.remotePath}
              onChange={(e) => setSftpCredentials({...sftpCredentials, remotePath: e.target.value})}
              className="col-span-3"
              placeholder="/incoming/trial-data/"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-secrets-sftp"
              checked={showSecrets}
              onCheckedChange={setShowSecrets}
            />
            <Label htmlFor="show-secrets-sftp" className="text-sm">Show secret values</Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection}>
              Test Connection
            </Button>
            <Button>
              Save Credentials
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderS3Form = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="s3-region" className="text-right">
              AWS Region
            </Label>
            <Select
              value={s3Credentials.region}
              onValueChange={(value) => setS3Credentials({...s3Credentials, region: value})}
            >
              <SelectTrigger id="s3-region" className="col-span-3">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bucket-name" className="text-right">
              Bucket Name
            </Label>
            <Input
              id="bucket-name"
              value={s3Credentials.bucketName}
              onChange={(e) => setS3Credentials({...s3Credentials, bucketName: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prefix" className="text-right">
              Prefix
            </Label>
            <Input
              id="prefix"
              value={s3Credentials.prefix}
              onChange={(e) => setS3Credentials({...s3Credentials, prefix: e.target.value})}
              className="col-span-3"
              placeholder="trial-data/"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="auth-method" className="text-right">
              Authentication
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="use-assume-role"
                checked={s3Credentials.useAssumeRole}
                onCheckedChange={(checked) => 
                  setS3Credentials({...s3Credentials, useAssumeRole: checked})
                }
              />
              <Label htmlFor="use-assume-role">Use IAM Role</Label>
            </div>
          </div>
          
          {!s3Credentials.useAssumeRole ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="access-key-id" className="text-right">
                  Access Key ID
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="access-key-id"
                    type={showSecrets ? "text" : "password"}
                    value={s3Credentials.accessKeyId}
                    onChange={(e) => setS3Credentials({...s3Credentials, accessKeyId: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secret-access-key" className="text-right">
                  Secret Access Key
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="secret-access-key"
                    type={showSecrets ? "text" : "password"}
                    value={s3Credentials.secretAccessKey}
                    onChange={(e) => setS3Credentials({...s3Credentials, secretAccessKey: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-arn" className="text-right">
                Role ARN
              </Label>
              <Input
                id="role-arn"
                value={s3Credentials.roleArn}
                onChange={(e) => setS3Credentials({...s3Credentials, roleArn: e.target.value})}
                className="col-span-3"
                placeholder="arn:aws:iam::123456789012:role/integration-role"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-secrets-s3"
              checked={showSecrets}
              onCheckedChange={setShowSecrets}
            />
            <Label htmlFor="show-secrets-s3" className="text-sm">Show secret values</Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection}>
              Test Connection
            </Button>
            <Button>
              Save Credentials
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credentials Configuration
            </CardTitle>
            <CardDescription>
              Configure secure connection credentials for Integration #{integrationId}
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {integrationType === "API" && (
              <TabsTrigger value="auth" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                API Authentication
              </TabsTrigger>
            )}
            <TabsTrigger value="connection" className="flex items-center gap-1">
              <Server className="h-4 w-4" />
              Connection Details
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Security Options
            </TabsTrigger>
          </TabsList>
          
          {integrationType === "API" && (
            <TabsContent value="auth">
              {renderAuthForm()}
            </TabsContent>
          )}
          
          <TabsContent value="connection">
            {integrationType === "SFTP" && renderSFTPForm()}
            {integrationType === "S3" && renderS3Form()}
            {integrationType === "API" && (
              <Alert className="mb-4">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Please configure API authentication details in the Authentication tab.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="security">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Credential Storage</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure how credentials are stored and managed
                    </p>
                  </div>
                </div>
                
                <div className="rounded-md border p-4 space-y-4">
                  <div className="flex items-start space-x-4">
                    <div>
                      <FileKey className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Encryption at Rest</h4>
                      <p className="text-sm text-muted-foreground">
                        All credentials are encrypted using AES-256 before storing in the database.
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="rotation-period" className="text-sm">
                            Key Rotation Period
                          </Label>
                          <Select defaultValue="90">
                            <SelectTrigger id="rotation-period" className="w-[180px]">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="180">180 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div>
                      <ClipboardCheck className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Access Controls</h4>
                      <p className="text-sm text-muted-foreground">
                        Control which users and roles can access these credentials.
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="admin-access" defaultChecked />
                          <Label htmlFor="admin-access" className="text-sm">
                            Allow Admin Access
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="data-manager-access" defaultChecked />
                          <Label htmlFor="data-manager-access" className="text-sm">
                            Allow Data Manager Access
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="study-manager-access" />
                          <Label htmlFor="study-manager-access" className="text-sm">
                            Allow Study Manager Access
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div>
                      <FolderKey className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Credential Usage Audit</h4>
                      <p className="text-sm text-muted-foreground">
                        Track all access and usage of these credentials.
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="enable-audit" defaultChecked />
                          <Label htmlFor="enable-audit" className="text-sm">
                            Enable Audit Logging
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button>
                  Save Security Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}