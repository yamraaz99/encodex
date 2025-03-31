
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EncoderForm from "@/components/EncoderForm";
import DecoderForm from "@/components/DecoderForm";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { extractMessageFromQR } from "@/utils/qrCode";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("encode");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Secret Message Encoder & Decoder";
    
    // Check if there's a decode parameter in the URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('decrypt')) {
      setActiveTab("decode");
    }
  }, []);

  // Handle file uploads for QR code scanning
  useEffect(() => {
    // Listen for paste events (for QR code images)
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          // Process the image - in a real app this would scan for QR codes
          setActiveTab("decode");
          toast({
            title: "Image Detected",
            description: "QR code image detected. Switching to decode mode."
          });
        }
      }
    };

    // Listen for drag-and-drop events
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          setActiveTab("decode");
          toast({
            title: "Image Detected",
            description: "QR code image detected. Switching to decode mode.",
            duration: 3000,
          });
        }
      }
    };
    
    // Enhanced share target handling for web share API
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SHARE_TARGET_URL') {
          const sharedUrl = event.data.url;
          const params = new URLSearchParams(new URL(sharedUrl).search);
          const text = params.get('text');
          if (text) {
            setActiveTab("decode");
          }
        }
      });
    }

    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DarkModeToggle />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Secret Message Encoder & Decoder</h1>
          <p className="text-muted-foreground">Securely encrypt and decrypt messages with multiple methods</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="encode" className="text-lg py-3">Encode</TabsTrigger>
              <TabsTrigger value="decode" className="text-lg py-3">Decode</TabsTrigger>
            </TabsList>
            
            <div className="bg-card rounded-lg shadow-lg border animate-fade-in">
              <TabsContent value="encode" className="mt-0">
                <EncoderForm />
              </TabsContent>
              
              <TabsContent value="decode" className="mt-0">
                <DecoderForm />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <footer className="mt-10 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Secret Message Encoder & Decoder</p>
          <p className="mt-1">Securely encrypt, decrypt and share your messages</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
