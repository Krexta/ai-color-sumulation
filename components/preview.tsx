"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression"; 
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Download } from "lucide-react";
import Image from "next/image";

interface Props {
  mode: "free" | "billing";
  count: number;
  setCountValue: () => void;
}

export const Preview = (props: Props) => {
  const { mode, count, setCountValue } = props;

  const [imagePreviews, setImagePreviews] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
  
      try {
        // HEICファイルを検出
        if (file.type === "image/heic" || file.name.endsWith(".HEIC") || file.name.endsWith(".heic")) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              if (reader.result) {
                const base64File = (reader.result as string).split(",")[1]; // Base64部分のみ抽出
  
                // APIを呼び出して変換処理を実行
                const response = await fetch("/api/convert-heic", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fileBuffer: base64File,
                    fileName: file.name,
                  }),
                });
  
                const data = await response.json();
                // 変換後の画像をプレビュー
                const convertedBase64 = `data:image/jpeg;base64,${data.base64Image}`;
                setImagePreviews(convertedBase64);
  
                // Base64データから File オブジェクトに変換
                const base64ToFile = (base64Data: string, fileName: string) => {
                  // Base64データのデコード
                  const byteCharacters = atob(base64Data);

                  // Base64データをUint8Arrayに変換
                  const byteArrays = Array.from({ length: Math.ceil(byteCharacters.length / 1024) }, (_, i) => {
                    const slice = byteCharacters.slice(i * 1024, (i + 1) * 1024);

                    // byteNumbersを初期化
                    const byteNumbers = new Array(slice.length);

                    // slice内の文字を順番にcharCodeAtで数値化
                    for (let j = 0; j < slice.length; j++) {
                      byteNumbers[j] = slice.charCodeAt(j);
                    }

                    return new Uint8Array(byteNumbers);
                  });

                  // Blobを生成してFileオブジェクトを作成
                  const blob = new Blob(byteArrays, { type: "image/jpeg" });
                  return new File([blob], fileName, { type: "image/jpeg" });
                };

                // 変換後のBase64データをFileオブジェクトに変換
                const fileFromBase64 = base64ToFile(data.base64Image, file.name.replace(/\.heic$/i, ".jpg"));

                // 圧縮処理（Fileオブジェクトを渡す）
                const compressedFile = await imageCompression(fileFromBase64, {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 800,
                  useWebWorker: true,
                });
  
                const compressedReader = new FileReader();
                compressedReader.onloadend = () => {
                  try {
                    setImagePreviews(compressedReader.result as string);
                  } catch (error) {
                    console.error("圧縮後の画像読み込みエラー:", error);
                    setErrorMessage("圧縮後の画像の読み込み中にエラーが発生しました。");
                  }
                };
                compressedReader.readAsDataURL(compressedFile);
              }
            } catch (error) {
              console.error("HEIC変換処理エラー:", error);
              setErrorMessage(
                "HEICファイルの変換中にエラーが発生しました。別のファイルを試してください。"
              );
            }
          };
          reader.readAsDataURL(file); // Base64形式で読み取り
        } else {
          // 他のフォーマットは通常の処理
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              setImagePreviews(reader.result as string);
  
              // 圧縮処理
              const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
                useWebWorker: true,
              };
              const compressedFile = await imageCompression(file, options);
  
              const compressedReader = new FileReader();
              compressedReader.onloadend = () => {
                try {
                  setImagePreviews(compressedReader.result as string);
                } catch (error) {
                  console.error("圧縮後の画像読み込みエラー:", error);
                  setErrorMessage("圧縮後の画像の読み込み中にエラーが発生しました。");
                }
              };
              compressedReader.readAsDataURL(compressedFile);
            } catch (error) {
              console.error("画像読み込みエラー:", error);
              setErrorMessage("画像の読み込み中にエラーが発生しました。");
            }
          };
          reader.readAsDataURL(file);
        }
  
        // 入力フィールドをリセット
        event.target.value = "";
      } catch (error) {
        console.error("画像処理中のエラー:", error);
        setErrorMessage("画像処理中にエラーが発生しました。もう一度お試しください。");
      }
    }
  };
  
  


  const handleColorChange = async () => {
    // 無料プランはcountが5以上になったらアラートを表示させる
    // 有料プランはcountが20以上になったらアラートを表示させる
    if (
      (mode === "free" && count >= 5) ||
      (mode === "billing" && count >= 20)
    ) {
      const message =
        mode === "free"
          ? "無料プランは５回までの実施となります。お問い合わせいただければ有料プランに切り替えることができますのでご検討ください。"
          : "カラーシュミレーションは２０回までの実施となります。ご要望がございましたらお問い合わせください。";

      alert(message);
      return;
    }

    if (!imagePreviews || !selectedArea || !searchTerm) return;
    setIsProcessing(true);
    setErrorMessage(null);

    setCountValue();

    try {
      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imagePreviews,
          selectedArea,
          searchTerm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        setErrorMessage(
          `HTTP ${response.status}: ${
            errorData.message || "不明なエラーが発生しました。"
          }`
        );
        throw new Error("Error in API call");
      }

      const data = await response.json();
      console.log("API response:", data);

      // Set base64Image data
      const base64Image = `${data.base64Image}`;
      setResultImage(base64Image);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(`スクリプト実行エラー: ${error.message}`);
      } else {
        setErrorMessage("スクリプト実行中に不明なエラーが発生しました。");
      }
      console.error("Error executing script:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">AIカラーシミュレーション</h1>

      <Card className="mb-6 relative w-3/4 mx-auto">
        <CardContent className="p-4">
          <input 
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="file-upload"
          />
          {!imagePreviews && (
            <label 
              htmlFor="file-upload" 
              className={`w-full h-60 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer ${imagePreviews ? 'hidden' : ''}`}
            >
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">写真をアップロード</span>
            </label>
          )}
          {imagePreviews && (
            <div className="w-100 h-100 rounded-lg overflow-hidden">
              <Image
                src={imagePreviews}
                alt="Uploaded image" 
                className="object-cover w-full h-full"
                width={600}
                height={300}
              />
              <label 
                htmlFor="file-upload" 
                className="absolute bottom-2 right-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg cursor-pointer"
              >
                画像を変更
              </label>
            </div>  
          )}
        </CardContent>
      </Card>

      <Card className="mb-4 w-3/4 mx-auto flex flex-col">
        <CardContent className="p-4 space-y-4 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 flex-grow">
          <Label htmlFor="output-format-select">箇所を選択</Label>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger>
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roof">屋根</SelectItem>
              <SelectItem value="wall">外壁</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="color-select">カラーを選択</Label>
          <Select value={searchTerm} onValueChange={(value) => {
            setSearchTerm(value);
          }}>
            <SelectTrigger>
              <span>{searchTerm || ""}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="黒">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full bg-black mr-2 border border-gray-300" />
                  黒
                </div>
              </SelectItem>
              <SelectItem value="茶">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full bg-brown mr-2 border border-gray-300" />
                  茶
                </div>
              </SelectItem>
              <SelectItem value="グレー">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full bg-gray-500 mr-2 border border-gray-300" />
                  グレー
                </div>
              </SelectItem>
              <SelectItem value="白">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full bg-white mr-2 border border-gray-300" />
                  白
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className=" text-red-600 text-sm p-1 mb-4 rounded">
          {errorMessage}
        </div>
      )}

      {resultImage && (
        <div className="flex flex-col items-center mt-4 mb-4">
          <h2 className="font-bold">シミュレーション結果</h2>
          <Image src={resultImage} alt="Result image" width={600} height={300} />
          <div className="flex justify-start mt-2">
            <Button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = resultImage;
                link.download = `result.jpeg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="mt-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" /> 
              画像をダウンロード
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex justify-center">
        <Button onClick={handleColorChange} disabled={!imagePreviews || !selectedArea || !searchTerm} className="w-3/4 mx-auto mb-6">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            "色を変更"
          )}
        </Button>
      </div>
    </div>
  );
}