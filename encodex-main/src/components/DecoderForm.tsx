import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  simpleDecrypt, caesarDecrypt, base64Decrypt, emojiDecrypt, passwordUnprotect,
  extractMessageMetadata, isLikelyPasswordProtected, detectEncryptionMethod
} from "@/utils/encryption";
import { useToast } from "@/hooks/use-toast";
import type { EncryptionMethod } from './EncoderForm';
import { isMessageViewed, markMessageAsViewed } from '@/utils/selfDestruct';
import { isAppQRCode, extractMessageFromQR } from '@/utils/qrCode';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DecoderForm: React.FC = () => {
  const [encryptedText, setEncryptedText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [method, setMethod] = useState<EncryptionMethod>('simple');
  const [password, setPassword] = useState('');
  const [caesarShift, setCaesarShift] = useState(3);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [isMessageDestroyed, setIsMessageDestroyed] = useState(false);
  const [messageMetadata, setMessageMetadata] = useState<any>(null);
  const [showDestructAlert, setShowDestructAlert] = useState(false);
  const [needsCustomKey, setNeedsCustomKey] = useState(false);
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const [selfDestructCountdown, setSelfDestructCountdown] = useState<number | null>(null);
  const [decryptionAttempts, setDecryptionAttempts] = useState(0);
  const { toast } = useToast();
  
  const messageShownRef = useRef(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encryptedParam = params.get('decrypt');
      
      if (encryptedParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const decodedText = decodeURIComponent(encryptedParam);
        setEncryptedText(decodedText);
        detectEncryption(decodedText);
        toast({
          title: "Message Received",
          description: "An encrypted message was detected in the URL"
        });
      }
    } catch (error) {
      console.error("Error processing URL parameters:", error);
    }
  }, []);

  useEffect(() => {
    if (isPasswordIncorrect) {
      setIsPasswordIncorrect(false);
    }
  }, [password]);

  useEffect(() => {
    let timer: number | null = null;
    
    if (selfDestructCountdown !== null && selfDestructCountdown > 0) {
      timer = window.setTimeout(() => {
        setSelfDestructCountdown(selfDestructCountdown - 1);
      }, 1000);
    }
    
    if (selfDestructCountdown === 0) {
      setShowDestructAlert(true);
    }
    
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [selfDestructCountdown]);

  const detectEncryption = (text: string) => {
    const { metadata, text: cleanText } = extractMessageMetadata(text);
    
    if (metadata) {
      setMessageMetadata(metadata);
      setMethod(metadata.type);
      setIsPasswordProtected(metadata.passwordProtected || false);
      
      if (metadata.type === 'caesar' && metadata.shift !== undefined) {
        setCaesarShift(metadata.shift);
      }
      
      if (metadata.customEncryption) {
        setNeedsCustomKey(true);
        setUseCustomKey(true);
      } else {
        setNeedsCustomKey(false);
        setUseCustomKey(false);
      }
      
      return;
    }
    
    const isPwProtected = isLikelyPasswordProtected(text);
    setIsPasswordProtected(isPwProtected);
    
    const detectedMethod = detectEncryptionMethod(text);
    if (detectedMethod) {
      setMethod(detectedMethod);
      toast({
        title: "Encryption Detected",
        description: `Auto-detected ${detectedMethod} encryption method`
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setEncryptedText(newText);
    setDecryptedText('');
    setIsMessageDestroyed(false);
    messageShownRef.current = false;
    
    if (isAppQRCode(newText)) {
      const extractedMessage = extractMessageFromQR(newText);
      setEncryptedText(extractedMessage);
      toast({
        title: "QR Code Detected",
        description: "Content extracted from QR code"
      });
      
      detectEncryption(extractedMessage);
    } else if (newText) {
      detectEncryption(newText);
    }
  };

  const tryDecryptWithMethod = (messageText: string, decryptMethod: EncryptionMethod, shiftValue?: number): string | null => {
    try {
      let result = '';
      
      switch (decryptMethod) {
        case 'simple':
          result = simpleDecrypt(messageText);
          break;
        case 'caesar':
          result = caesarDecrypt(messageText, shiftValue ?? caesarShift);
          break;
        case 'base64':
          result = base64Decrypt(messageText);
          break;
        case 'emoji':
          result = emojiDecrypt(messageText);
          break;
      }
      
      const readableTextRegex = /^[\x20-\x7E\s]+$/;
      if (readableTextRegex.test(result) || /\p{Emoji}/u.test(messageText)) {
        return result;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleDecrypt = () => {
    if (!encryptedText) {
      toast({
        title: "Error",
        description: "Please enter some text to decrypt",
        variant: "destructive"
      });
      return;
    }
    
    setDecryptionAttempts(prev => prev + 1);
    const { text: messageToDecrypt, metadata } = extractMessageMetadata(encryptedText);
    
    if (metadata?.selfDestruct && metadata.messageId) {
      if (isMessageViewed(metadata.messageId) && messageShownRef.current) {
        setIsMessageDestroyed(true);
        toast({
          title: "Message Self-Destructed",
          description: "This message has already been viewed and is no longer available.",
          variant: "destructive"
        });
        return;
      }
    }
    
    let decrypted = '';
    
    if (isPasswordProtected) {
      if (!password) {
        toast({
          title: "Password Required",
          description: "This message is password protected. Please enter the password to decrypt.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        decrypted = passwordUnprotect(messageToDecrypt, password);
      } catch (error) {
        setIsPasswordIncorrect(true);
        toast({
          title: "Incorrect Password",
          description: "The password you entered doesn't match. Please try again with the correct password.",
          variant: "destructive",
          duration: 5000,
        });
        setDecryptedText("");
        return;
      }
    } else {
      decrypted = messageToDecrypt;
    }
    
    if (needsCustomKey) {
      if (!customKey) {
        toast({
          title: "Custom Key Required",
          description: "This message was encrypted with a custom key. Please enter it to decrypt.",
          variant: "destructive"
        });
        return;
      }
      
      const keySum = customKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 26;
      decrypted = caesarDecrypt(decrypted, keySum);
    } else if (useCustomKey && customKey) {
      const keySum = customKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 26;
      decrypted = caesarDecrypt(decrypted, keySum);
    }
    
    try {
      const methodToUse = metadata?.type || method;
      let successfulDecryption = false;
      
      switch (methodToUse) {
        case 'simple':
          decrypted = simpleDecrypt(decrypted);
          successfulDecryption = true;
          break;
        case 'caesar':
          const shiftToUse = metadata?.shift !== undefined ? metadata.shift : caesarShift;
          decrypted = caesarDecrypt(decrypted, shiftToUse);
          successfulDecryption = true;
          break;
        case 'base64':
          try {
            decrypted = base64Decrypt(decrypted);
            successfulDecryption = true;
          } catch {
            // Will try alternative methods below
          }
          break;
        case 'emoji':
          try {
            decrypted = emojiDecrypt(decrypted);
            successfulDecryption = true;
          } catch {
            // Will try alternative methods below
          }
          break;
      }
      
      if (!successfulDecryption) {
        const methods: [EncryptionMethod, number?][] = [
          ['emoji', undefined], 
          ['base64', undefined], 
          ['simple', undefined]
        ];
        
        for (let i = 1; i <= 25; i++) {
          methods.push(['caesar', i]);
        }
        
        for (const [tryMethod, shift] of methods) {
          const result = tryDecryptWithMethod(decrypted, tryMethod, shift);
          if (result) {
            decrypted = result;
            setMethod(tryMethod);
            if (tryMethod === 'caesar') setCaesarShift(shift || 3);
            
            toast({
              title: "Alternative Decryption Found",
              description: `Successfully decrypted using ${tryMethod}${tryMethod === 'caesar' ? ` (shift: ${shift})` : ''}`,
            });
            break;
          }
        }
      }
      
      setDecryptedText(decrypted);
      messageShownRef.current = true;
      
      if (metadata?.selfDestruct && metadata.messageId) {
        markMessageAsViewed(metadata.messageId);
        toast({
          title: "Self-Destructing Message",
          description: "This message will self-destruct in 3 seconds",
          variant: "default"
        });
        setSelfDestructCountdown(3);
      } else {
        toast({
          title: "Success",
          description: "Your message has been decrypted"
        });
      }
    } catch (error) {
      console.error("Decryption error:", error);
      toast({
        title: "Decryption Failed",
        description: "Could not decrypt the message with any known method. Please check your settings.",
        variant: "destructive"
      });
    }
  };

  const handleDestructConfirmation = () => {
    setIsMessageDestroyed(true);
    setDecryptedText('');
    setShowDestructAlert(false);
    setSelfDestructCountdown(null);
    
    toast({
      title: "Message Deleted Successfully",
      description: "The self-destructing message has been permanently deleted",
      variant: "default"
    });
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {isMessageDestroyed ? (
        <Alert variant="destructive" className="mb-6 animate-fade-in">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Message Self-Destructed</AlertTitle>
          <AlertDescription>
            This message has self-destructed and is no longer available.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div>
            <Label htmlFor="decrypt-text" className="text-lg font-medium">Encrypted Message</Label>
            <Textarea
              id="decrypt-text"
              className="mt-2 min-h-[150px] text-base"
              placeholder="Paste the encrypted message here..."
              value={encryptedText}
              onChange={handleTextChange}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Decryption Method</Label>
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
              <p className="text-xs mt-1 text-muted-foreground">
                Auto-detection will attempt to identify the encryption method
              </p>
            </div>
            
            {method === 'caesar' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="decrypt-shift-value">Shift Value: {caesarShift}</Label>
                </div>
                <Slider 
                  id="decrypt-shift-value"
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
                checked={useCustomKey || needsCustomKey}
                onCheckedChange={(checked) => {
                  if (!needsCustomKey) setUseCustomKey(checked);
                }}
                disabled={needsCustomKey}
              />
              <Label htmlFor="use-custom-key" className={needsCustomKey ? "text-amber-500 font-medium" : ""}>
                {needsCustomKey ? "Custom Key Required" : "Use Custom Decryption Key"}
              </Label>
            </div>
            
            {(useCustomKey || needsCustomKey) && (
              <div className="animate-fade-in">
                <Label htmlFor="custom-key" className={needsCustomKey ? "text-amber-500" : ""}>
                  Custom Key
                </Label>
                <Input
                  id="custom-key"
                  type="text"
                  placeholder={needsCustomKey ? "Required for decryption" : "Enter the custom decryption key"}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className={needsCustomKey ? "border-amber-500 focus:ring-amber-500" : ""}
                />
                {needsCustomKey && (
                  <p className="text-xs mt-1 text-amber-500">
                    This message requires the custom key that was used during encryption
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is-password-protected" 
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
                <Label htmlFor="is-password-protected">
                  This message is password protected
                </Label>
              </div>
              
              {isPasswordProtected && (
                <div className="animate-fade-in">
                  <Label htmlFor="decrypt-password" className={isPasswordIncorrect ? "text-destructive" : ""}>
                    Password
                  </Label>
                  <Input
                    id="decrypt-password"
                    type="password"
                    placeholder="Enter the decryption password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={isPasswordIncorrect ? "border-destructive focus:ring-destructive" : ""}
                  />
                  {isPasswordIncorrect && (
                    <p className="text-xs mt-1 text-destructive">
                      Incorrect password. Please try again.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <Button 
              className="w-full hover:scale-105 transition-transform"
              onClick={handleDecrypt}
              disabled={!encryptedText}
            >
              Decrypt Message
            </Button>
          </div>
          
          {decryptedText && (
            <div className="space-y-2 border-t pt-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <Label htmlFor="decrypted-result" className="text-lg font-medium">Decrypted Message</Label>
                
                {messageMetadata?.selfDestruct && (
                  <div className="flex items-center text-amber-500">
                    {selfDestructCountdown !== null && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                        Self-destructs in: {selfDestructCountdown}s
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Textarea
                id="decrypted-result"
                className="mt-2 min-h-[100px]"
                value={decryptedText}
                readOnly
              />
              
              {messageMetadata?.selfDestruct && (
                <p className="text-xs text-amber-500 mt-2 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  This is a self-destructing message. It will no longer be available after the countdown.
                </p>
              )}
            </div>
          )}
        </>
      )}
      
      <AlertDialog open={showDestructAlert} onOpenChange={setShowDestructAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Message Will Self-Destruct</AlertDialogTitle>
            <AlertDialogDescription>
              This message was set to self-destruct after viewing. Once you close this dialog, 
              the message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDestructConfirmation}>
              I understand, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DecoderForm;
