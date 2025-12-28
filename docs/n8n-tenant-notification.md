# Configuration N8N - Notification Locataire (Approbation Intervention)

## 📧 Objectif
Envoyer un email automatique au locataire quand le propriétaire approuve le devis d'intervention.

## 🔗 Webhook à configurer dans N8N

### Event Name
`tenant-intervention-approved`

### Payload reçu
```json
{
  "tenantEmail": "locataire@example.com",
  "tenantName": "John Doe",
  "description": "Porte claquée",
  "artisanName": "Serrurerie Express",
  "artisanPhone": "+221771234567",
  "artisanAddress": "Dakar, Plateau",
  "interventionDate": "15/01/2025",
  "quoteAmount": 15000
}
```

## 📝 Template Email

### Sujet
```
✅ Intervention validée : {{description}}
```

### Corps HTML
```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">✅ Intervention Validée</h1>
  </div>

  <!-- Body -->
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
      Bonjour <strong>{{tenantName}}</strong>,
    </p>

    <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
      Bonne nouvelle ! La demande d'intervention pour <strong style="color: #16a34a;">{{description}}</strong> a été validée par le propriétaire.
    </p>

    <!-- Carte Artisan -->
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #15803d; font-weight: bold;">
        👷‍♂️ Artisan Assigné
      </p>
      <h2 style="margin: 10px 0; font-size: 20px; color: #111827;">{{artisanName}}</h2>

      <div style="margin-top: 15px;">
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">
          <strong>📞 Téléphone :</strong>
          <a href="tel:{{artisanPhone}}" style="color: #16a34a; text-decoration: none; font-weight: 600;">{{artisanPhone}}</a>
        </p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">
          <strong>📍 Adresse :</strong> {{artisanAddress}}
        </p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">
          <strong>📅 Date prévue :</strong> {{interventionDate}}
        </p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">
          <strong>💰 Montant :</strong> {{quoteAmount}} FCFA
        </p>
      </div>
    </div>

    <!-- Instructions -->
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>ℹ️ Que faire maintenant ?</strong><br/>
        L'artisan a été notifié et devrait vous contacter sous peu. Si vous ne recevez pas d'appel dans les 24h, n'hésitez pas à le contacter directement au numéro ci-dessus.
      </p>
    </div>

    <!-- Footer -->
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; line-height: 1.6;">
      Cordialement,<br/>
      <strong style="color: #111827;">L'équipe de Gestion</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />

    <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
      Cet email a été envoyé automatiquement. Pour toute question, contactez votre propriétaire.
    </p>
  </div>
</div>
```

## 🔧 Configuration N8N (Workflow)

### Étape 1 : Webhook Trigger
- **Node Type:** Webhook
- **Webhook Name:** `tenant-intervention-approved`
- **HTTP Method:** POST
- **Response Mode:** When Last Node Finishes

### Étape 2 : Send Email
- **Node Type:** Send Email (SMTP)
- **From Email:** `noreply@votredomaine.com`
- **From Name:** `Gestion Immobilière`
- **To Email:** `{{$json.tenantEmail}}`
- **Subject:** `✅ Intervention validée : {{$json.description}}`
- **Email Type:** HTML
- **HTML Content:** _Coller le template ci-dessus_

### Étape 3 : (Optionnel) Log Success
- **Node Type:** Code (JavaScript)
- **Code:**
```javascript
console.log(`✅ Email envoyé à ${$json.tenantEmail} pour intervention ${$json.description}`);
return { success: true, timestamp: new Date().toISOString() };
```

## 🧪 Test

### Payload de test
```json
{
  "tenantEmail": "votre-email@test.com",
  "tenantName": "Test Locataire",
  "description": "Test Plomberie",
  "artisanName": "Artisan Test",
  "artisanPhone": "+221771234567",
  "artisanAddress": "Dakar Test",
  "interventionDate": "31/12/2025",
  "quoteAmount": 25000
}
```

Envoyez ce payload via l'interface N8N pour tester l'envoi d'email.

## ✅ Validation

Une fois configuré, le workflow complet est :

1. **Propriétaire** clique sur "Approuver 15000 FCFA"
2. **Backend** met à jour le statut → `approved`
3. **Backend** appelle N8N avec l'événement `tenant-intervention-approved`
4. **N8N** envoie un email au locataire avec toutes les infos artisan
5. **Locataire** reçoit l'email et peut contacter l'artisan directement

---

**Date de création :** 2025-01-28
**Dernière mise à jour :** 2025-01-28
