/* Compatibilidad para dependencias que esperan el global de Node.js. */
((window as unknown) as { global: Window }).global = window;
