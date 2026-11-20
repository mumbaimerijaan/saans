import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AssistanceRequest,
  Equipment,
  Facility,
  CommunityReport,
  AQIReport,
  VolunteerTasksResponse,
  VolunteerMatch,
  VolunteerTask,
  AdminStats,
  User as UserType
} from '../types';
import { AqiBadge } from '../components/AqiBadge';
import {
  LayoutDashboard,
  User,
  Wrench,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Building2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
  Send,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, household, switchRoleQuick, isLoading: authLoading } = useAuth();

  const [aqReport, setAqReport] = useState<AQIReport | null>(null);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [volunteerTasks, setVolunteerTasks] = useState<VolunteerTasksResponse | null>(null);
  const [adminOverview, setAdminOverview] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Volunteer Task Complete Modal
  const [completingTask, setCompletingTask] = useState<VolunteerTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Admin Assign Modal
  const [assigningReq, setAssigningReq] = useState<AssistanceRequest | null>(null);
  const [volunteerMatches, setVolunteerMatches] = useState<VolunteerMatch[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [aq, reqs, eq, facs, rep] = await Promise.all([
        api.getCurrentAirQuality(19.0760, 72.8777, user?.city || 'Mumbai', user?.neighbourhood || 'Bandra West'),
        api.getRequests(),
        api.getEquipment(),
        api.getFacilities(),
        api.getReports(),
      ]);

      setAqReport(aq);
      setRequests(reqs.requests || []);
      setEquipment(eq.equipment || []);
      setFacilities(facs.facilities || []);
      setReports(rep.reports || []);

      if (user?.accountType === 'volunteer') {
        const vTasks = await api.getVolunteerTasks();
        setVolunteerTasks(vTasks);
      }

      if (user?.accountType === 'admin') {
        const [overview, usersRes] = await Promise.all([
          api.getAdminOverview(),
          api.getAdminUsers(),
        ]);
        setAdminOverview(overview.stats);
        setAdminUsers(usersRes.users || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Volunteer action: Accept task
  const handleAcceptTask = async (assignmentId: string) => {
    try {
      await api.acceptVolunteerTask(assignmentId);
      alert('Task accepted! You are now the active field volunteer for this request.');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Volunteer action: Complete task
  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;
    try {
      await api.completeVolunteerTask(completingTask.assignment.id, completionNotes);
      alert('Task marked as completed! Community impact record updated.');
      setCompletingTask(null);
      setCompletionNotes('');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Admin action: open match recommendations
  const handleOpenAssignModal = async (req: AssistanceRequest) => {
    setAssigningReq(req);
    setAssignLoading(true);
    try {
      const res = await api.getRequestMatches(req.id);
      setVolunteerMatches(res.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  // Admin action: assign volunteer
  const handleConfirmAssignment = async (volunteerId: string) => {
    if (!assigningReq) return;
    try {
      await api.assignVolunteerToRequest(assigningReq.id, volunteerId);
      alert('Volunteer successfully assigned! Task notification dispatched.');
      setAssigningReq(null);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    }
  };

  // Admin action: verify facility
  const handleVerifyFacility = async (id: string) => {
    try {
      await api.verifyFacility(id);
      alert('Facility verified and highlighted on public sanctuary directory.');
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  // Admin action: moderate report
  const handleModerateReport = async (id: string, status: string) => {
    try {
      await api.updateReportStatus(id, status, `Moderated by admin ${user?.fullName}`);
      alert(`Report marked as ${status}.`);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Moderation failed');
    }
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#080c0e] py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Clock className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
        <p className="text-sm font-medium text-slate-300">Loading your community clean air dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080c0e] py-16 px-4">
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#11181c] border border-slate-800 p-8 shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-display">Select Your Community Role</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              SAANS features role-specific workflows for citizens, field volunteers, equipment donors, and municipal coordinators. Choose a demo persona to explore:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              onClick={() => switchRoleQuick('citizen')}
              className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-teal-500 transition-all text-xs group"
            >
              <div className="font-bold text-white flex items-center gap-2 mb-1 group-hover:text-teal-400">
                <User className="w-4 h-4 text-teal-400" />
                <span>Priya Sharma (Citizen)</span>
              </div>
              <p className="text-[11px] text-slate-400">Kurla West &bull; Requesting air purifier for family near high-traffic corridor</p>
            </button>

            <button
              onClick={() => switchRoleQuick('volunteer')}
              className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 transition-all text-xs group"
            >
              <div className="font-bold text-white flex items-center gap-2 mb-1 group-hover:text-amber-400">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Rahul Deshmukh (Volunteer)</span>
              </div>
              <p className="text-[11px] text-slate-400">Dadar &bull; Field electrician delivering HEPA units & assembling Corsi boxes</p>
            </button>

            <button
              onClick={() => switchRoleQuick('donor')}
              className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-all text-xs group"
            >
              <div className="font-bold text-white flex items-center gap-2 mb-1 group-hover:text-emerald-400">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>CleanAir Foundation (Donor)</span>
              </div>
              <p className="text-[11px] text-slate-400">Andheri &bull; Donating commercial HEPA units & MERV-13 filter rolls</p>
            </button>

            <button
              onClick={() => switchRoleQuick('admin')}
              className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500 transition-all text-xs group"
            >
              <div className="font-bold text-white flex items-center gap-2 mb-1 group-hover:text-rose-400">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>SAANS Team (Coordinator)</span>
              </div>
              <p className="text-[11px] text-slate-400">Citywide &bull; Overview metrics, volunteer matching & incident moderation</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Dashboard Banner */}
        <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
              {user.accountType === 'citizen' && <User className="w-3.5 h-3.5" />}
              {user.accountType === 'volunteer' && <Wrench className="w-3.5 h-3.5" />}
              {user.accountType === 'donor' && <HeartHandshake className="w-3.5 h-3.5" />}
              {user.accountType === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{user.accountType} Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Welcome back, {user.fullName || (user as any).full_name || 'Member'}
            </h1>
            <p className="text-xs text-slate-400">
              Location: <strong>{user.neighbourhood}, {user.city}</strong> &bull; Member since 2026
            </p>
          </div>

          {/* Quick local air status badge */}
          {aqReport && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Local Air Status</div>
                <div className="text-xs text-slate-200 font-semibold">{aqReport.neighbourhood}</div>
              </div>
              <AqiBadge
                aqi={aqReport.indianAqi.index}
                category={aqReport.indianAqi.category}
                size="md"
              />
            </div>
          )}
        </div>

        {/* 1. CITIZEN DASHBOARD VIEW */}
        {user.accountType === 'citizen' && (
          <div className="space-y-8">
            
            {/* Active Requests Tracking */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">Your Active Assistance Requests</h2>
                  <p className="text-xs text-slate-400">Track real-time progress and volunteer assignments.</p>
                </div>
                <Link
                  to="/get-help"
                  className="px-4 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                >
                  + New Request
                </Link>
              </div>

              {requests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800/80">
                  <p className="text-xs">You have no pending assistance requests.</p>
                  <Link to="/get-help" className="text-teal-400 text-xs font-semibold hover:underline mt-1 inline-block">
                    Request an air purifier or DIY assembly &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white capitalize">{req.category.replace('_', ' ')}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-1">{req.description}</p>
                        <div className="text-[11px] text-slate-500 mt-1">
                          📍 {req.location_neighbourhood} &bull; Urgency: <strong className="text-amber-400 uppercase">{req.urgency}</strong>
                        </div>
                      </div>

                      {req.assignedVolunteerName && (
                        <div className="text-right">
                          <div className="text-[11px] text-teal-400 font-semibold">Assigned Volunteer:</div>
                          <div className="text-xs font-bold text-white">{req.assignedVolunteerName}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Household Protection Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">Household Protection Profile</h3>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div>Housing: <strong>{household?.housing_type || 'Apartment in Mumbai'}</strong></div>
                  <div>Members: <strong>{household?.member_count || 4} residents</strong></div>
                  <div>Elderly Residents: <strong>{household?.elderly_present ? 'Yes (High Sensitivity)' : 'No'}</strong></div>
                  <div>Children Present: <strong>{household?.children_present ? 'Yes' : 'No'}</strong></div>
                  <div>Room Dimensions: <strong>{household?.room_size_sqft || 280} sq ft</strong></div>
                </div>
                <Link
                  to="/diy-lab"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 mt-2"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Calculate Purifier Sizing for this room</span>
                </Link>
              </div>

              <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">Immediate Community Sanctuaries</h3>
                <p className="text-xs text-slate-400">
                  When indoor AQI spikes, these verified filtered spaces are within your service perimeter:
                </p>
                <div className="space-y-2">
                  {facilities.slice(0, 2).map(f => (
                    <div key={f.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{f.name}</div>
                        <div className="text-[11px] text-slate-400">{f.operating_hours}</div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 font-semibold"
                      >
                        Map ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. VOLUNTEER DASHBOARD VIEW */}
        {user.accountType === 'volunteer' && (
          <div className="space-y-8">
            
            {/* Active Assignments & Tasks */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Active Volunteer Assignments</h2>
                <p className="text-xs text-slate-400">Field tasks assigned to you across Mumbai.</p>
              </div>

              {volunteerTasks?.activeTasks?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-teal-400 mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-300">You have no active tasks currently in progress.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Review available open requests below to accept an assignment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {volunteerTasks?.activeTasks?.map(item => (
                    <div
                      key={item.assignment.id}
                      className="p-5 rounded-xl bg-slate-900 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm capitalize">{item.request?.category.replace('_', ' ')}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            {item.assignment.status}
                          </span>
                        </div>
                        <p className="text-slate-300">{item.request?.description}</p>
                        <div className="text-[11px] text-slate-400 pt-1">
                          👤 Requester: <strong>{item.creatorName || item.request?.creatorName || 'Citizen'}</strong> ({item.creatorPhone || item.request?.creatorPhone || 'Phone via in-app'}) &bull; 📍 {item.request?.location_neighbourhood}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.assignment.status === 'assigned' && (
                          <button
                            onClick={() => handleAcceptTask(item.assignment.id)}
                            className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors shadow-md"
                          >
                            Accept Assignment
                          </button>
                        )}
                        {(item.assignment.status === 'accepted' || item.assignment.status === 'in_progress') && (
                          <button
                            onClick={() => setCompletingTask(item)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md"
                          >
                            Mark Completed & Log Evidence
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Community Requests (Ready for Pickup) */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Unassigned Approved Requests in Mumbai</h3>
              <p className="text-xs text-slate-400">These citizen requests need volunteer assembly or equipment transport.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {volunteerTasks?.availableRequests?.map(req => (
                  <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300 capitalize">{req.category.replace('_', ' ')}</span>
                      <span className="text-[10px] uppercase font-bold text-amber-400">{req.urgency} urgency</span>
                    </div>
                    <p className="text-slate-300 line-clamp-2">{req.description}</p>
                    <div className="text-[11px] text-slate-400">
                      📍 {req.location_neighbourhood} &bull; Requester: {req.creatorName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 3. DONOR DASHBOARD VIEW */}
        {user.accountType === 'donor' && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">Your Listed Equipment & Donations</h2>
                  <p className="text-xs text-slate-400">Manage air purifiers and filters you have made available for the community.</p>
                </div>
                <Link
                  to="/equipment"
                  className="px-4 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                >
                  + Add Item
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {equipment.filter(e => e.donor_id === user.id || e.donorName?.includes('CleanAir')).map(item => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      <div className="text-[11px] text-teal-400 font-medium capitalize mt-0.5">{item.type} &bull; {item.category.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Status: <strong className="text-slate-200">{item.status}</strong></div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      {item.condition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMINISTRATOR DASHBOARD VIEW */}
        {user.accountType === 'admin' && (
          <div className="space-y-8">
            
            {/* High-level system statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800">
                <div className="text-2xl font-black text-white font-display">{adminOverview?.totalUsers ?? 4}</div>
                <div className="text-xs font-semibold text-slate-400">Total Registered Users</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800">
                <div className="text-2xl font-black text-teal-400 font-display">{adminOverview?.openRequests ?? 2}</div>
                <div className="text-xs font-semibold text-slate-400">Open Requests</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800">
                <div className="text-2xl font-black text-emerald-400 font-display">{adminOverview?.availableEquipment ?? 4}</div>
                <div className="text-xs font-semibold text-slate-400">Equipment in Stock</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800">
                <div className="text-2xl font-black text-amber-400 font-display">{adminOverview?.pendingReports ?? 1}</div>
                <div className="text-xs font-semibold text-slate-400">Reports Pending Review</div>
              </div>
            </div>

            {/* Assistance Requests Moderation Queue */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Assistance Requests Moderation & Volunteer Assignment</h3>
              <p className="text-xs text-slate-400">Review submitted citizen requests and match them with nearby volunteers.</p>

              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white capitalize">{req.category.replace('_', ' ')}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-teal-300">
                          {req.status}
                        </span>
                        <span className="text-[10px] text-amber-400 uppercase font-bold">{req.urgency}</span>
                      </div>
                      <p className="text-slate-300">{req.description}</p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Requester: <strong>{req.creatorName}</strong> &bull; Location: {req.location_neighbourhood}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'submitted' && (
                        <button
                          onClick={async () => {
                            await api.updateRequestStatus(req.id, 'approved', 'Approved by administrator');
                            loadDashboardData();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400"
                        >
                          Approve Request
                        </button>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => handleOpenAssignModal(req)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Match Volunteer</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pollution Incident Moderation Queue */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Community Pollution Incident Queue</h3>
              <p className="text-xs text-slate-400">Review reported smoke, burning, or construction dust before publishing.</p>

              <div className="space-y-3">
                {reports.map(rep => (
                  <div key={rep.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white capitalize">{rep.category.replace('_', ' ')}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">"{rep.description}"</p>
                      <div className="text-[11px] text-slate-400 mt-1">📍 {rep.neighbourhood}, Mumbai</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.status !== 'verified' && rep.status !== 'resolved' && (
                        <button
                          onClick={() => handleModerateReport(rep.id, 'verified')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                        >
                          Verify Incident
                        </button>
                      )}
                      {rep.status === 'verified' && (
                        <button
                          onClick={() => handleModerateReport(rep.id, 'resolved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                        >
                          Mark Civic Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TASK COMPLETE MODAL */}
        {completingTask && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="complete-modal-title">
            <div className="w-full max-w-md bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 id="complete-modal-title" className="text-lg font-bold text-white mb-1 font-display">Mark Task as Completed</h3>
              <p className="text-xs text-slate-400 mb-4">
                Record your field notes for request #{completingTask.request?.id.slice(0, 8)}.
              </p>

              <form onSubmit={handleCompleteTask} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="task-completion-notes" className="block text-slate-300 font-bold mb-1">Work Summary / Notes *</label>
                  <textarea
                    id="task-completion-notes"
                    rows={3}
                    value={completionNotes}
                    onChange={e => setCompletionNotes(e.target.value)}
                    placeholder="e.g. Assembled 4-filter Corsi-Rosenthal unit. Replaced fan shroud and verified zero air bypass."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCompletingTask(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    aria-label="Confirm completion of volunteer assignment"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Complete Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN VOLUNTEER MATCH MODAL */}
        {assigningReq && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
            <div className="w-full max-w-xl bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 id="assign-modal-title" className="text-lg font-bold text-white mb-1 font-display">
                Matching Volunteers for Request
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Category: <strong>{assigningReq.category}</strong> &bull; Location: {assigningReq.location_neighbourhood}
              </p>

              {assignLoading ? (
                <div className="p-8 text-center text-slate-500">
                  <Clock className="w-6 h-6 mx-auto animate-spin text-teal-400 mb-2" />
                  <p className="text-xs">Computing spatial distance and skill scores...</p>
                </div>
              ) : volunteerMatches.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-900 rounded-xl">
                  No active volunteers found within the radius.
                </div>
              ) : (
                <div className="space-y-3">
                  {volunteerMatches.map((match, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{match.volunteerUser.fullName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300">
                            Score: {match.matchScore}%
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">{match.rationale}</p>
                      </div>

                      <button
                        onClick={() => handleConfirmAssignment(match.volunteerProfile.id)}
                        className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors flex-shrink-0"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end mt-4">
                <button
                  onClick={() => setAssigningReq(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
