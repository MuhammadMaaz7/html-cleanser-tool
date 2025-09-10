"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Download, Eye, EyeOff, X, FileText } from "lucide-react"

export default function HTMLTagRemover() {
  const [files, setFiles] = useState<File[]>([])
  const [tagsToRemove, setTagsToRemove] = useState("")
  const [keepInnerContent, setKeepInnerContent] = useState(true)
  const [processedFiles, setProcessedFiles] = useState<{ [key: string]: string }>({})
  const [showPreview, setShowPreview] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string>("")

  const commonTags = ["a", "script", "iframe", "div", "span", "img", "style"]

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      const isHTML = file.name.endsWith(".html") || file.name.endsWith(".htm")
      const isValidSize = file.size <= MAX_FILE_SIZE

      if (!isHTML) {
        alert(`${file.name} is not an HTML file and will be skipped.`)
      }
      if (!isValidSize) {
        alert(`${file.name} exceeds the 100MB limit and will be skipped.`)
      }

      return isHTML && isValidSize
    })

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file) => {
      const isValidSize = file.size <= MAX_FILE_SIZE

      if (!isValidSize) {
        alert(`${file.name} exceeds the 100MB limit and will be skipped.`)
      }

      return isValidSize
    })

    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles])
    }

    e.target.value = ""
  }

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
    const fileToRemove = files[indexToRemove]
    if (fileToRemove) {
      setProcessedFiles((prev) => {
        const updated = { ...prev }
        delete updated[fileToRemove.name]
        return updated
      })
    }
  }

  const clearAllFiles = () => {
    setFiles([])
    setProcessedFiles({})
    setSelectedPreviewFile("")
  }

  const addCommonTag = (tag: string) => {
    const currentTags = tagsToRemove
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (!currentTags.includes(tag)) {
      setTagsToRemove(currentTags.concat(tag).join(", "))
    }
  }

  const processHTML = async () => {
    if (files.length === 0 || !tagsToRemove.trim()) return

    const processed: { [key: string]: string } = {}

    try {
      for (const file of files) {
        const htmlContent = await file.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, "text/html")

        const tagsArray = tagsToRemove
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)

        tagsArray.forEach((tagName) => {
          const elements = doc.querySelectorAll(tagName)
          elements.forEach((element) => {
            if (keepInnerContent) {
              const parent = element.parentNode
              if (parent) {
                while (element.firstChild) {
                  parent.insertBefore(element.firstChild, element)
                }
                parent.removeChild(element)
              }
            } else {
              element.remove()
            }
          })
        })

        const processedContent = doc.documentElement.outerHTML
        processed[file.name] = processedContent
      }

      setProcessedFiles(processed)
      if (!selectedPreviewFile && files.length > 0) {
        setSelectedPreviewFile(files[0].name)
      }
    } catch (error) {
      console.error("Error processing HTML:", error)
      alert("Error processing HTML files. Please check the file formats.")
    }
  }

  const downloadProcessedFile = (fileName?: string) => {
    if (fileName) {
      const content = processedFiles[fileName]
      if (!content) return

      const blob = new Blob([content], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")

      const originalName = fileName.replace(/\.(html?|htm)$/i, "")
      a.href = url
      a.download = `${originalName}_cleaned.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const firstFileName = Object.keys(processedFiles)[0]
      if (firstFileName) {
        downloadProcessedFile(firstFileName)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">HTML Tag Remover</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Remove unwanted HTML tags from your files while preserving content and structure
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Upload HTML Files</CardTitle>
            <CardDescription className="text-sm">
              Drag and drop your HTML files or click to browse (up to 100MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mb-3 sm:mb-4" />
              {files.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-muted/50 rounded-lg p-2 sm:p-3 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <input
                      type="file"
                      accept=".html,.htm"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <Button variant="outline" asChild size="sm" className="w-full sm:w-auto bg-transparent">
                      <label htmlFor="file-input" className="cursor-pointer">
                        Add More Files
                      </label>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    Drop your HTML files here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".html,.htm"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <Button variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                    <label htmlFor="file-input" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Configure Tag Removal</CardTitle>
            <CardDescription className="text-sm">Specify which HTML tags to remove from your file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags-input" className="text-sm sm:text-base">
                Tags to Remove (comma-separated)
              </Label>
              <Input
                id="tags-input"
                placeholder="e.g., a, script, iframe, div"
                value={tagsToRemove}
                onChange={(e) => setTagsToRemove(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Quick Add Common Tags</Label>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {commonTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => addCommonTag(tag)}
                    className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-start sm:items-center space-x-2">
              <Checkbox
                id="keep-content"
                checked={keepInnerContent}
                onCheckedChange={(checked) => setKeepInnerContent(checked as boolean)}
                className="mt-0.5 sm:mt-0"
              />
              <Label htmlFor="keep-content" className="text-xs sm:text-sm leading-relaxed">
                Keep inner content (e.g., &lt;a&gt;Click&lt;/a&gt; → "Click")
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            onClick={processHTML}
            disabled={files.length === 0 || !tagsToRemove.trim()}
            className="flex-1 text-sm sm:text-base h-10 sm:h-11"
          >
            Remove Tags & Process ({files.length} file{files.length !== 1 ? "s" : ""})
          </Button>

          {Object.keys(processedFiles).length > 0 && (
            <>
              <Button
                onClick={() => downloadProcessedFile()}
                variant="outline"
                className="flex items-center justify-center gap-2 bg-transparent h-10 sm:h-11 sm:flex-initial"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download All</span>
                <span className="sm:hidden">Download</span>
              </Button>

              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex items-center justify-center gap-2 h-10 sm:h-11 sm:flex-initial"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline">{showPreview ? "Hide" : "Show"} Preview</span>
                <span className="sm:hidden">{showPreview ? "Hide" : "Preview"}</span>
              </Button>
            </>
          )}
        </div>

        {showPreview && Object.keys(processedFiles).length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Preview of Cleaned HTML</CardTitle>
              <CardDescription>
                {Object.keys(processedFiles).length > 1 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                    {Object.keys(processedFiles).map((fileName) => (
                      <Button
                        key={fileName}
                        variant={selectedPreviewFile === fileName ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPreviewFile(fileName)}
                        className="text-xs px-2 py-1 h-7 sm:h-8 max-w-[120px] sm:max-w-none truncate"
                        title={fileName}
                      >
                        <span className="truncate">{fileName}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {selectedPreviewFile && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <p className="text-sm font-medium truncate" title={selectedPreviewFile}>
                      Previewing: {selectedPreviewFile}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadProcessedFile(selectedPreviewFile)}
                      className="flex items-center gap-1 w-full sm:w-auto justify-center"
                    >
                      <Download className="h-3 w-3" />
                      <span className="hidden sm:inline">Download This File</span>
                      <span className="sm:hidden">Download</span>
                    </Button>
                  </div>
                )}
                <Textarea
                  value={selectedPreviewFile ? processedFiles[selectedPreviewFile] || "" : ""}
                  readOnly
                  className="min-h-[200px] sm:min-h-[300px] font-mono text-xs leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
