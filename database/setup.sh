#!/bin/bash
# ============================================================
# Script de configuración de BD local para pruebas
# ============================================================

echo "🔧 Configurando base de datos local para talleres_api..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Verificar si MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL no está instalado${NC}"
    echo "Instalar con: brew install mysql"
    exit 1
fi

# Verificar si MySQL está corriendo
if ! pgrep -x "mysqld" > /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL no está corriendo. Intentando iniciar...${NC}"
    brew services start mysql 2>/dev/null || mysql.server start 2>/dev/null
    sleep 2
fi

# Solicitar contraseña de root (o usar vacía)
echo -e "${YELLOW}Ingresa la contraseña de root de MySQL (Enter si no tiene):${NC}"
read -s MYSQL_ROOT_PASSWORD

# Ejecutar el script SQL
echo ""
echo "📦 Creando base de datos mapos_local..."

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    mysql -u root < "$SCRIPT_DIR/setup_local.sql"
else
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$SCRIPT_DIR/setup_local.sql"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Base de datos creada exitosamente!${NC}"
    echo ""
    
    # Copiar .env.local a .env
    echo "📋 Configurando archivo .env..."
    cp "$API_DIR/.env.local" "$API_DIR/.env"
    
    # Actualizar contraseña en .env si se proporcionó
    if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/DB_PASSWORD=/DB_PASSWORD=$MYSQL_ROOT_PASSWORD/" "$API_DIR/.env"
        else
            sed -i "s/DB_PASSWORD=/DB_PASSWORD=$MYSQL_ROOT_PASSWORD/" "$API_DIR/.env"
        fi
    fi
    
    echo -e "${GREEN}✅ Archivo .env configurado${NC}"
    echo ""
    echo "============================================================"
    echo -e "${GREEN}🚀 LISTO PARA INICIAR${NC}"
    echo "============================================================"
    echo ""
    echo "Ejecutar:"
    echo "  cd $API_DIR"
    echo "  npm install"
    echo "  npm start"
    echo ""
    echo "============================================================"
    echo "CREDENCIALES DE PRUEBA:"
    echo "============================================================"
    echo ""
    echo "👤 USUARIOS (password: password123)"
    echo "   - david@digicom.com (admin)"
    echo "   - maria@digicom.com (tecnico)"
    echo "   - carlos@digicom.com (tecnico)"
    echo "   - ana@digicom.com (recepcionista)"
    echo "   - test@test.com (admin)"
    echo ""
    echo "👥 CLIENTES (password: password123)"
    echo "   - juan@email.com"
    echo "   - sofia@email.com"
    echo "   - cliente@test.com"
    echo ""
    echo "============================================================"
else
    echo -e "${RED}❌ Error al crear la base de datos${NC}"
    exit 1
fi
