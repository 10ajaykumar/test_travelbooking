{{- define "common.configMap" -}}
{{- if and .Values.configMap.enabled .Values.env }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "common.configMapName" . }}
  labels:
    {{- include "common.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.env }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end }}
{{- end -}}
