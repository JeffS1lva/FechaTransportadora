"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import type { Driver } from "@/lib/types";

interface ImportDriverDialogProps {
  trigger?: React.ReactNode;
}

interface ParsedRow {
  name: string;
  cpf: string;
  vehicle: string;
  licensePlate: string;
  status: "active" | "inactive";
  error?: string;
  valid: boolean;
}

export function ImportDriverDialog({ trigger }: ImportDriverDialogProps) {
  const { drivers, addDriver } = useData();
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeCpf = (cpf: string) => cpf.replace(/\D/g, "");

  const resetState = () => {
    setParsedData([]);
    setImporting(false);
    setImported(false);
  };

  // Verifica se é arquivo Excel binário
  const isExcelBinary = (buffer: ArrayBuffer): boolean => {
    const view = new Uint8Array(buffer);
    return (
      (view[0] === 0x50 && view[1] === 0x4b) || // ZIP (xlsx)
      (view[0] === 0xd0 && view[1] === 0xcf) // OLE (xls)
    );
  };

  // Lê arquivo Excel usando SheetJS
  const readExcelFile = async (
    buffer: ArrayBuffer,
  ): Promise<{ headers: string[]; rows: any[][] }> => {
    const XLSX = await import("xlsx");

    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: "array",
      cellFormula: false,
      cellHTML: false,
      cellText: true,
    });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as any[][];

    if (data.length < 2) {
      throw new Error("Planilha vazia ou sem dados");
    }

    const headers = data[0].map((h) =>
      String(h || "")
        .toLowerCase()
        .trim(),
    );
    const rows = data.slice(1);

    return { headers, rows };
  };

  // Parser para arquivos de texto (CSV, TSV, Markdown)
  const parseTextFile = (
    content: string,
  ): { headers: string[]; rows: any[][] } => {
    // Detecta se é Markdown
    if (content.includes("|")) {
      return parseMarkdown(content);
    }

    // Detecta delimitador
    const firstLine = content.split("\n")[0] || "";
    const tabs = (firstLine.match(/\t/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;

    const delimiter =
      tabs > semicolons && tabs > commas
        ? "\t"
        : semicolons > commas
          ? ";"
          : ",";

    return parseDelimited(content, delimiter);
  };

  const parseMarkdown = (
    content: string,
  ): { headers: string[]; rows: any[][] } => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.match(/^[\|\s:-]+$/));

    if (lines.length < 2) throw new Error("Tabela Markdown inválida");

    const parseLine = (line: string): string[] => {
      return line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => {
          if (idx === 0 || idx === arr.length - 1) return cell.length > 0;
          return true;
        });
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const rows = lines.slice(1).map((line) => parseLine(line));

    return { headers, rows };
  };

  const parseDelimited = (
    content: string,
    delimiter: string,
  ): { headers: string[]; rows: any[][] } => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) throw new Error("Arquivo vazio");

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      let quoteChar = "";

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          if (line[i + 1] === quoteChar) {
            current += char;
            i++;
          } else {
            inQuotes = false;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const rows = lines.slice(1).map(parseLine);

    return { headers, rows };
  };

  // Mapeamento flexível de headers
  const getHeaderMapping = (headers: string[]): Record<string, number> => {
    const map: Record<string, number> = {};

    headers.forEach((header, index) => {
      const h = header
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (
        h.includes("nome") ||
        h === "name" ||
        h === "nome completo" ||
        h === "colaborador" ||
        h === "motorista"
      ) {
        map.name = index;
      } else if (h.includes("cpf") || h === "documento" || h === "doc") {
        map.cpf = index;
      } else if (
        h.includes("veiculo") ||
        h.includes("vehicle") ||
        h === "carro" ||
        h === "modelo"
      ) {
        map.vehicle = index;
      } else if (h.includes("placa") || h.includes("license")) {
        map.licensePlate = index;
      } else if (
        h.includes("status") ||
        h === "situacao" ||
        h === "situação" ||
        h === "ativo"
      ) {
        map.status = index;
      }
    });

    return map;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImported(false);

    try {
      const ext = file.name.toLowerCase().split(".").pop() || "";
      const isExcel = ["xlsx", "xls", "xlsm", "xlsb", "ods"].includes(ext);

      let headers: string[] = [];
      let rows: any[][] = [];

      if (isExcel) {
        const buffer = await file.arrayBuffer();

        if (isExcelBinary(buffer)) {
          const result = await readExcelFile(buffer);
          headers = result.headers;
          rows = result.rows;
        } else {
          const text = new TextDecoder().decode(buffer);
          const result = parseTextFile(text);
          headers = result.headers;
          rows = result.rows;
        }
      } else {
        const text = await file.text();
        const result = parseTextFile(text);
        headers = result.headers;
        rows = result.rows;
      }

      if (rows.length === 0) {
        toast.error("Arquivo vazio ou sem dados");
        return;
      }

      const headerMap = getHeaderMapping(headers);
      console.log("Headers:", headers);
      console.log("Mapeamento:", headerMap);

      if (headerMap.name === undefined) {
        toast.error(
          `Coluna "Nome" não encontrada. Colunas: ${headers.join(", ")}`,
        );
        return;
      }

      if (headerMap.cpf === undefined) {
        toast.error(
          `Coluna "CPF" não encontrada. Colunas: ${headers.join(", ")}`,
        );
        return;
      }

      const existingCpf = new Set(drivers.map((d) => normalizeCpf(d.cpf)));
      const seenCpfs = new Set<string>();

      const parsed: ParsedRow[] = rows.map((row) => {
        const getValue = (key: keyof typeof headerMap): string => {
          const index = headerMap[key];
          return index !== undefined ? String(row[index] ?? "").trim() : "";
        };

        const cpf = getValue("cpf");
        const normalizedCpf = normalizeCpf(cpf);
        const name = getValue("name");
        const vehicle = getValue("vehicle");
        const licensePlate = getValue("licensePlate");
        const statusRaw = getValue("status").toLowerCase();
        const status = (
          statusRaw === "inactive" ||
          statusRaw === "inativo" ||
          statusRaw === "0"
            ? "inactive"
            : "active"
        ) as "active" | "inactive";

        let valid = true;
        let error: string | undefined;

        if (!name) {
          valid = false;
          error = "Nome é obrigatório";
        } else if (!normalizedCpf) {
          valid = false;
          error = "CPF inválido";
        } else if (existingCpf.has(normalizedCpf)) {
          valid = false;
          error = "CPF já cadastrado";
        } else if (seenCpfs.has(normalizedCpf)) {
          valid = false;
          error = "CPF duplicado no arquivo";
        }

        if (normalizedCpf) {
          seenCpfs.add(normalizedCpf);
        }

        return {
          name,
          cpf,
          vehicle,
          licensePlate,
          status,
          valid,
          error,
        };
      });

      setParsedData(parsed);

      const validCount = parsed.filter((p) => p.valid).length;
      if (validCount > 0) {
        toast.success(`${validCount} registros válidos encontrados`);
      } else {
        toast.error("Nenhum registro válido encontrado");
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      toast.error("Erro ao processar arquivo. Tente salvar como CSV.");
    }
  };

  const handleImport = () => {
    setImporting(true);

    const validRows = parsedData.filter((row) => row.valid);

    validRows.forEach((row) => {
      addDriver({
        name: row.name,
        cpf: row.cpf,
        phone: "",
        vehicle: row.vehicle,
        licensePlate: row.licensePlate,
        status: row.status,
        cnh: "",
        cnhCategory: "",
        cnhExpiration: "",
        professionalRegister: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        vehicleYear: "",
        vehicleColor: "",
        renavam: "",
        observations: "",
        secondaryPhone: "",
        email: "",
        birthDate: "",
        rg: "",
      });
    });

    setImporting(false);
    setImported(true);

    toast.success(`Importados ${validRows.length} motorista(s)`);

    setTimeout(() => {
      resetState();
      setImported(false);
      setOpen(false);
    }, 1500);
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const invalidCount = parsedData.filter((r) => !r.valid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetState();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogOverlay className="backdrop-blur-sm bg-black/40" />
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Motoristas</DialogTitle>
          <DialogDescription>
            Importe motoristas a partir de um arquivo CSV, Excel ou outros
            formatos de planilha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.ods,.txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo ou clique para selecionar
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-3">
            <div>
              <p className="font-medium mb-2">Formato esperado do CSV:</p>
              <code className="text-xs text-muted-foreground block overflow-x-auto whitespace-pre-wrap">
                Nome,CPF,Telefone,Veículo,Placa,CNH,Categoria CNH,Validade
                CNH,Status,CEP,Rua,Número,Complemento,Bairro,Cidade,UF
              </code>
            </div>

            <div className="border-t border-border pt-3">
              <p className="font-medium mb-2">Tipos de planilha aceitos:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Excel (.xlsx, .xls, .xlsm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>CSV (vírgula ou ponto-e-vírgula)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>LibreOffice/OpenOffice (.ods)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>TSV (tabulação)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Google Sheets (exportado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <span>Texto delimitado (.txt)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-2">
              O sistema detecta automaticamente as colunas. Apenas{" "}
              <strong>Nome</strong> e <strong>CPF</strong> são obrigatórios.
            </p>
          </div>

          {parsedData.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Check className="h-4 w-4" />
                  {validCount} válidos
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {invalidCount} com erros
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border overflow-hidden max-h-75 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={!row.valid ? "bg-destructive/10" : ""}
                      >
                        <TableCell>
                          {row.valid ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {row.name}
                          {row.error && (
                            <span className="text-xs text-destructive block">
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.cpf}</TableCell>
                        <TableCell>{row.vehicle}</TableCell>
                        <TableCell>{row.licensePlate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setParsedData([])}>
                  Limpar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing || imported}
                >
                  {imported ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Importado!
                    </>
                  ) : (
                    `Importar ${validCount} motorista(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
