import React, { useState } from "react";
import Navbar from "../components/dashboard/Navbar.jsx";
import Toast from "../components/dashboard/Toast.jsx";
import InvoiceForm from "../components/dashboard/InvoiceForm.jsx";
import InvoiceHistory from "../components/dashboard/InvoiceHistory.jsx";
import PageContainer from "../components/layout/PageContainer.jsx";
import Header from "../components/layout/Header.jsx";
import Button from "../components/common/Button.jsx";

import { useInvoices } from "../hooks/useInvoices.js";
import { useClients } from "../hooks/useClients.js";
import { useToast } from "../hooks/useToast.js";

export default function Dashboard({ user }) {
  const [tab, setTab] = useState("new");

  const { toast, showToast, clearToast } = useToast();
  const { invoices, itemOptions, loading: invLoading, addInvoice } = useInvoices();
  const { clients, addClient } = useClients();

  async function handleSubmitInvoice(invoicePayload, itemsPayload, clientName) {
    await addInvoice(invoicePayload, itemsPayload, clientName);
    setTab("list");
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={clearToast} />}

      <Navbar user={user} />

      <PageContainer>
        <Header title="Invoices">
          {tab === "list" && (
            <Button variant="accent" onClick={() => setTab("new")}>
              + New Invoice
            </Button>
          )}
        </Header>

        <div className="tabs">
          <button
            className={`tab-btn${tab === "new" ? " active" : ""}`}
            onClick={() => setTab("new")}
          >
            New Invoice
          </button>
          <button
            className={`tab-btn${tab === "list" ? " active" : ""}`}
            onClick={() => setTab("list")}
          >
            All Invoices {invoices.length > 0 && `(${invoices.length})`}
          </button>
        </div>

        {tab === "new" && (
          <InvoiceForm
            user={user}
            clients={clients}
            itemOptions={itemOptions}
            onSubmit={handleSubmitInvoice}
            onAddClient={addClient}
            showToast={showToast}
          />
        )}

        {tab === "list" && (
          <InvoiceHistory
            invoices={invoices}
            onNewInvoice={() => setTab("new")}
          />
        )}
      </PageContainer>
    </>
  );
}
