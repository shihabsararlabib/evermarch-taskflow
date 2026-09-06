import { NextRequest, NextResponse } from 'next/server';
import { supabase, isCloudConfigured } from '@/lib/db';
import { Board, Task } from '@/types';

// In-memory fallback server store when running without cloud credentials
let inMemoryBoard: Board | null = null;

export async function GET() {
  try {
    if (isCloudConfigured && supabase) {
      // 1. Fetch repairs from Cloud PostgreSQL
      const { data: repairs, error: repairsError } = await supabase
        .from('repair_jobs')
        .select('*')
        .order('order_index', { ascending: true });

      if (repairsError) {
        console.error('Failed to fetch from PostgreSQL:', repairsError);
        return NextResponse.json({ success: false, error: repairsError.message }, { status: 500 });
      }

      // 2. Fetch companies & branches
      const { data: companiesData } = await supabase.from('companies').select('id, name');
      const { data: branchesData } = await supabase.from('branches').select('id, company_id, name');
      const { data: techsData } = await supabase.from('technicians').select('*');

      const companies = (companiesData || []).map((c) => ({
        id: c.id,
        name: c.name,
        branches: (branchesData || [])
          .filter((b) => b.company_id === c.id)
          .map((b) => b.name),
      }));

      // Transform SQL repairs to Task interface
      const tasks: Task[] = (repairs || []).map((r) => ({
        id: r.id,
        serialNumber: r.serial_number,
        printerModel: r.printer_model,
        companyName: r.company_name,
        branchName: r.branch_name,
        title: r.title,
        description: r.description || '',
        receivedDate: r.received_date,
        reportedFault: r.reported_fault,
        diagnosisNotes: r.diagnosis_notes || '',
        partsReplaced: r.parts_replaced || '',
        priority: r.priority,
        columnId: r.stage_id,
        order: r.order_index,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        labels: [],
        assignee: techsData?.find((t) => t.id === r.assigned_technician_id) || null,
      }));

      return NextResponse.json({
        success: true,
        source: 'cloud-postgresql',
        timestamp: Date.now(),
        data: {
          tasks,
          companies,
          assignees: techsData || [],
        },
      });
    }

    // Return in-memory fallback state
    return NextResponse.json({
      success: true,
      source: 'local-server',
      timestamp: Date.now(),
      data: inMemoryBoard,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { action, board, task, taskId } = payload;

    if (isCloudConfigured && supabase) {
      if (action === 'upsert-task' && task) {
        // Upsert printer record first
        await supabase.from('printers').upsert({
          serial_number: task.serialNumber,
          model: task.printerModel,
          total_repairs: task.repairCount || 1,
          is_viable: task.isViable !== false,
          last_intake_at: task.receivedDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Upsert repair job record
        await supabase.from('repair_jobs').upsert({
          id: task.id,
          serial_number: task.serialNumber,
          printer_model: task.printerModel,
          company_name: task.companyName,
          branch_name: task.branchName,
          title: task.title,
          description: task.description,
          received_date: task.receivedDate,
          reported_fault: task.reportedFault || '',
          diagnosis_notes: task.diagnosisNotes || '',
          parts_replaced: task.partsReplaced || '',
          priority: task.priority,
          stage_id: task.columnId,
          assigned_technician_id: task.assignee?.id || null,
          due_date: task.dueDate || null,
          order_index: task.order || 0,
          updated_at: new Date().toISOString(),
        });
      } else if (action === 'delete-task' && taskId) {
        await supabase.from('repair_jobs').delete().eq('id', taskId);
      }
    }

    // Keep server memory updated as buffer
    if (board) {
      inMemoryBoard = board;
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      mode: isCloudConfigured ? 'cloud-postgresql' : 'local-buffer',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
