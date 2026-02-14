import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FuriganaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (kanji: string, reading: string) => void;
}

const FuriganaModal = ({ open, onOpenChange, onInsert }: FuriganaModalProps) => {
  const [kanji, setKanji] = useState("");
  const [reading, setReading] = useState("");

  const handleInsert = () => {
    if (!kanji || !reading) return;
    onInsert(kanji, reading);
    setKanji("");
    setReading("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">振り仮名を追加</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            漢字とその読み方を入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="kanji" className="text-xs">漢字 (Kanji)</Label>
            <Input
              id="kanji"
              value={kanji}
              onChange={(e) => setKanji(e.target.value)}
              placeholder="例: 漢字"
              className="font-jp text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading" className="text-xs">読み方 (Reading)</Label>
            <Input
              id="reading"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="例: かんじ"
              className="font-jp text-lg"
            />
          </div>
          {kanji && reading && (
            <div className="text-center py-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <span className="font-jp text-2xl">
                <ruby>{kanji}<rt>{reading}</rt></ruby>
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleInsert} disabled={!kanji || !reading}>
            挿入する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FuriganaModal;
