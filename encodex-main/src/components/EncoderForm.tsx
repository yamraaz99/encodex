
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, QrCode, Share, Link, Check } from "lucide-react";
import { 
  simpleEncrypt, caesarEncrypt, base64Encrypt, emojiEncrypt, passwordProtect,
  addMessageMetadata, MessageMetadata
} from "@/utils/encryption";
import { generateMessageId, storeDestructMessage } from "@/utils/selfDestruct";
import { generateQRCode } from "@/utils/qrCode";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

export type EncryptionMethod = 'simple' | 'caesar' | 'base64' | 'emoji';

const EncoderForm: React.FC = () => {
  const [text, setText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [method, setMethod] = useState<EncryptionMethod>('simple');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [caesarShift, setCaesarShift] = useState(3);
  const [qrCode, setQrCode] = useState('');
  const [autoDestruct, setAutoDestruct] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showCopiedIcon, setShowCopiedIcon] = useState(false);
  const { toast } = useToast();

  const handleEncrypt = () => {
    if (!text) {
      toast({
        title: "Error",
        description: "Please enter some text to encrypt",
        variant: "destructive"
      });
      return;
    }

    let encrypted = '';
    
    // Generate message ID for self-destruct functionality
    const messageId = generateMessageId();
    
    switch (method) {
      case 'simple':
        encrypted = simpleEncrypt(text);
        break;
      case 'caesar':
        encrypted = caesarEncrypt(text, caesarShift);
        break;
      case 'base64':
        encrypted = base64Encrypt(text);
        break;
      case 'emoji':
        encrypted = emojiEncrypt(text);
        break;
      default:
        encrypted = text;
    }
    
    // Apply custom key if provided
    if (useCustomKey && customKey) {
      // Use the custom key as an additional Caesar shift based on sum of char codes
      const keySum = customKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 26;
      encrypted = caesarEncrypt(encrypted, keySum);
    }
    
    // Password protect if needed
    if (usePassword && password) {
      encrypted = passwordProtect(encrypted, password);
    }
    
    // If auto-destruct is enabled, store the message ID
    if (autoDestruct) {
      storeDestructMessage(messageId);
    }
    
    // Add metadata for easier decoding
    const metadata: MessageMetadata = {
      type: method,
      passwordProtected: usePassword && !!password,
      selfDestruct: autoDestruct,
      shift: method === 'caesar' ? caesarShift : undefined,
      messageId: autoDestruct ? messageId : undefined,
      customEncryption: useCustomKey && !!customKey
    };
    
    const finalEncrypted = addMessageMetadata(encrypted, metadata);
    setEncryptedText(finalEncrypted);
    
    // Generate QR code
    generateQrCodeForText(finalEncrypted);
    
    // Create shareable URL
    const shareableUrl = window.location.href.split('?')[0] + '?decrypt=' + encodeURIComponent(finalEncrypted);
    setShareLink(shareableUrl);
    
    toast({
      title: "Success",
      description: "Your message has been encrypted"
    });
  };

  const generateQrCodeForText = async (text: string) => {
    const qrDataUrl = await generateQRCode(text);
    setQrCode(qrDataUrl);
  };

  const handleCopy = () => {
    if (!encryptedText) return;
    
    navigator.clipboard.writeText(encryptedText);
    setShowCopiedIcon(true);
    
    setTimeout(() => {
      setShowCopiedIcon(false);
    }, 2000);
    
    toast({
      title: "Copied!",
      description: "Encrypted text copied to clipboard"
    });
  };

  const handleShare = async () => {
    if (!encryptedText) return;
    
    // Create a more comprehensive share object
    const shareData = {
      title: 'Secret Encrypted Message',
      text: 'I\'ve sent you an encrypted message. Decrypt it here:',
      // Add the URL of the app to allow direct decoding
      url: window.location.href.split('?')[0] + '?decrypt=' + encodeURIComponent(encryptedText)
    };
    
    try {
      // Check if native share is available (mobile devices mostly)
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared!",
          description: "Your message has been shared"
        });
      } else {
        // Improved fallback for desktop - copy share link to clipboard
        navigator.clipboard.writeText(shareData.url);
        
        toast({
          title: "Direct sharing unavailable",
          description: "A shareable link has been copied to your clipboard instead",
          duration: 4000,
        });
        
        // Show the shareable link
        setShareLink(shareData.url);
        
        // Display QR code as another sharing option
        if (!qrCode) {
          generateQrCodeForText(encryptedText);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Enhanced fallback for sharing failures - copy link and show QR
      navigator.clipboard.writeText(shareData.url);
      
      toast({
        title: "Sharing failed",
        description: "A shareable link has been copied to your clipboard instead. You can also use the QR code.",
        duration: 4000,
      });
      
      // Show the shareable link
      setShareLink(shareData.url);
      
      // Ensure QR code is generated
      if (!qrCode) {
        generateQrCodeForText(encryptedText);
      }
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    
    navigator.clipboard.writeText(shareLink);
    
    toast({
      title: "Link Copied!",
      description: "Shareable link copied to clipboard"
    });
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div>
        <Label htmlFor="encrypt-text" className="text-lg font-medium">Text to Encrypt</Label>
        <Textarea
          id="encrypt-text"
          className="mt-2 min-h-[150px] text-base"
          placeholder="Enter your secret message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Encryption Method</Label>
          <ToggleGroup 
            type="single" 
            className="mt-2 justify-start flex-wrap"
            value={method}
            onValueChange={(value) => value && setMethod(value as EncryptionMethod)}
          >
            <ToggleGroupItem value="simple" className="text-sm px-3">Simple Cipher</ToggleGroupItem>
            <ToggleGroupItem value="caesar" className="text-sm px-3">Caesar Cipher</ToggleGroupItem>
            <ToggleGroupItem value="base64" className="text-sm px-3">Base64</ToggleGroupItem>
            <ToggleGroupItem value="emoji" className="text-sm px-3">Emoji Code</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {method === 'caesar' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="shift-value">Shift Value: {caesarShift}</Label>
            </div>
            <Slider 
              id="shift-value"
              min={1}
              max={25}
              step={1}
              value={[caesarShift]}
              onValueChange={(value) => setCaesarShift(value[0])}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="use-custom-key" 
            checked={useCustomKey}
            onCheckedChange={setUseCustomKey}
          />
          <Label htmlFor="use-custom-key">Use Custom Encryption Key</Label>
        </div>
        
        {useCustomKey && (
          <div>
            <Label htmlFor="custom-key">Custom Key</Label>
            <Input
              id="custom-key"
              type="text"
              placeholder="Enter your custom encryption key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="animate-fade-in"
            />
            <p className="text-xs mt-1 text-muted-foreground">
              The recipient will need this custom key to decode your message correctly
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="use-password" 
            checked={usePassword}
            onCheckedChange={setUsePassword}
          />
          <Label htmlFor="use-password">Password Protection</Label>
        </div>
        
        {usePassword && (
          <div className="animate-fade-in">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs mt-1 text-muted-foreground">
              The recipient will need this password to decrypt the message
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-destruct" 
            checked={autoDestruct}
            onCheckedChange={setAutoDestruct}
          />
          <Label htmlFor="auto-destruct">Self-destruct after viewing</Label>
        </div>
        
        <Button 
          className="w-full hover:scale-105 transition-transform"
          onClick={handleEncrypt}
          disabled={!text}
        >
          Encrypt Message
        </Button>
      </div>
      
      {encryptedText && (
        <div className="space-y-4 border-t pt-4 animate-fade-in">
          <div>
            <Label htmlFor="encrypted-result" className="text-lg font-medium">Encrypted Message</Label>
            <Textarea
              id="encrypted-result"
              className="mt-2 min-h-[100px]"
              value={encryptedText}
              readOnly
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleCopy}
            >
              {showCopiedIcon ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {showCopiedIcon ? "Copied" : "Copy"}
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleShare}
            >
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  disabled={!qrCode}
                >
                  <QrCode className="mr-2 h-4 w-4" /> QR Code
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>QR Code for your secret message</SheetTitle>
                  <SheetDescription>
                    Scan this code to view the encrypted message
                  </SheetDescription>
                </SheetHeader>
                {qrCode && (
                  <div className="flex flex-col items-center">
                    <img 
                      src={qrCode}
                      alt="QR code for encrypted message"
                      className="max-w-[300px] max-h-[300px]"
                    />
                    <p className="text-sm mt-4 text-center text-muted-foreground">
                      This QR code contains your encrypted message.
                      {autoDestruct && " It will self-destruct after being viewed once."}
                    </p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
          
          {shareLink && (
            <div className="p-3 bg-muted rounded-md flex items-center gap-2 mt-2 animate-fade-in">
              <div className="truncate flex-1 text-sm">
                {shareLink}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                <Link className="mr-1 h-3 w-3" /> Copy Link
              </Button>
            </div>
          )}
          
          {autoDestruct && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-900/50 animate-pulse">
              <p className="text-sm text-center font-medium">This message will self-destruct after it's viewed once</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EncoderForm;
