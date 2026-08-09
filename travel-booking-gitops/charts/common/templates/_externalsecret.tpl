{{- define "common.externalSecrets" -}}
{{- range .Values.externalSecrets }}
{{- if .enabled }}
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ required "externalSecrets[].name is required" .name }}
  labels:
    {{- include "common.labels" $ | nindent 4 }}
spec:
  refreshInterval: {{ default "1h" .refreshInterval }}
  secretStoreRef:
    {{- toYaml .secretStoreRef | nindent 4 }}
  target:
    name: {{ required "externalSecrets[].target.name is required" .target.name }}
    creationPolicy: {{ default "Owner" .target.creationPolicy }}
  {{- with .data }}
  data:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with .dataFrom }}
  dataFrom:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
{{- end }}
{{- end -}}
